import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { executeInTransaction, getDb } from "../db/instance";
import {
  loadGame,
  requireActiveGame,
  requirePendingGame,
} from "../middleware/game";
import {
  ERROR_CODES,
  JoinGameSchema,
  loadPlayer,
  touchPlayer,
  validate,
} from "../middleware";
import { GameService } from "../services/GameService";
import { PlayerService } from "../services/PlayerService";
import { PlanetService } from "../services/PlanetService";
import { HexService } from "../services/HexService";
import { UnitService } from "../services/UnitService";
import {
  MapUtils,
  CONSTANTS,
  HexUtils,
  GameStates,
  UnitFactory,
} from "@solaris-command/core";

const router = express.Router();

// GET /api/v1/games
// List open games and my games
router.get("/", authenticateToken, async (req, res) => {
  const db = getDb();
  try {
    const { games, myGameIds } = await GameService.listGamesByUser(
      db,
      new ObjectId(req.user.id)
    );

    // Map to simple response
    // TODO: Need mapping layer
    const response = games.map((g) => ({
      id: g._id,
      name: g.name,
      description: g.description,
      state: g.state,
      settings: g.settings,
      userHasJoined: myGameIds.some((id) => id.toString() === g._id.toString()),
    }));

    res.json(response);
  } catch (error) {
    console.error("Error listing games:", error);
    res.status(500);
  }
});

// POST /api/v1/games/:id/join
router.post(
  "/:id/join",
  authenticateToken,
  validate(JoinGameSchema),
  loadGame,
  requirePendingGame,
  async (req, res) => {
    try {
      const result = await executeInTransaction(async (db, session) => {
        const gameId = req.game._id;
        const userId = new ObjectId(req.user.id);

        // 1. Check if already joined (Atomic check within transaction not strictly necessary if index unique, but good for logic)
        const existingPlayer = await PlayerService.getByGameAndUserId(
          db,
          gameId,
          userId
        );

        if (existingPlayer) {
          throw new Error(ERROR_CODES.USER_ALREADY_JOINED_GAME);
        }

        // 2. Check Capacity (req.game loaded before transaction)
        if (req.game.state.playerCount >= req.game.settings.playerCount) {
          throw new Error(ERROR_CODES.GAME_IS_FULL);
        }

        // Increment (Blind update)
        await GameService.incrementPlayerCount(db, gameId, session);

        // 3. Create Player
        const newPlayer = await PlayerService.joinGame(
          db,
          gameId,
          userId,
          {
            alias: req.body.alias,
            color: req.body.color,
          },
          session
        );

        // 4. Assign Capital
        const planets = await PlanetService.getByGameId(db, gameId);
        const capital = MapUtils.findUnownedCapital(planets);

        if (!capital) {
          throw new Error(ERROR_CODES.GAME_NO_CAPITAL_AVAILABLE);
        }

        await PlanetService.assignPlanetToPlayer(
          db,
          capital._id,
          newPlayer._id,
          session
        );

        // 4b. Assign Nearest Unoccupied Planet
        const secondPlanet = MapUtils.findNearestUnownedPlanet(
          planets,
          capital.location,
          capital._id
        );

        if (!secondPlanet) {
          throw new Error(ERROR_CODES.GAME_NO_SECOND_PLANET_AVAILABLE);
        }

        await PlanetService.assignPlanetToPlayer(
          db,
          secondPlanet._id,
          newPlayer._id,
          session
        );

        // 5. Assign Starting Fleet
        const hexes = await HexService.getByGameId(db, gameId);
        const fleetIds = CONSTANTS.STARTING_FLEET_IDS;

        const spawnHexes = MapUtils.findNearestFreeHexes(
          hexes,
          capital.location,
          fleetIds.length
        );

        // Make sure there are enough hexes to be able to spawn the player's starting fleet.
        if (fleetIds.length > spawnHexes.length) {
          throw new Error(ERROR_CODES.GAME_NOT_ENOUGH_SPAWN_HEXES);
        }

        for (let i = 0; i < spawnHexes.length; i++) {
          if (i >= fleetIds.length) break;

          const catalogId = fleetIds[i];
          const hex = spawnHexes[i];

          // Create Unit
          const unit = UnitFactory.createUnit(
            catalogId,
            newPlayer._id,
            gameId,
            hex.coords
          );

          const createdUnit = await UnitService.createUnit(db, unit, session);

          // Update Hex
          await HexService.updateHexUnit(db, hex._id, createdUnit._id, session);
        }

        // 6. Assign Territory (Hex Flipping)
        // Flip hexes within range 3 of capital
        const territoryCoords = HexUtils.getHexCoordsInRange(
          capital.location,
          3
        );
        const territoryIds = new Set(
          territoryCoords.map((c) => HexUtils.getCoordsID(c))
        );

        // Filter hexes that are in this territory
        const territoryHexes = hexes.filter((h) =>
          territoryIds.has(HexUtils.getCoordsID(h.coords))
        );

        for (const hex of territoryHexes) {
          if (
            hex.playerId &&
            hex.playerId.toString() !== newPlayer._id.toString()
          ) {
            // Contested! Set to null
            await HexService.updateHexOwnership(db, hex._id, null, session);
          } else {
            // Claim it
            await HexService.updateHexOwnership(
              db,
              hex._id,
              newPlayer._id,
              session
            );
          }
        }

        // 7. Check Game Start (Using req.game count + 1 for current player)
        // Note: req.game.state.playerCount is old value. We add 1.
        if (req.game.state.playerCount + 1 >= req.game.settings.playerCount) {
          const now = new Date();
          const startDate = new Date(
            now.getTime() + CONSTANTS.GAME_STARTING_WARMUP_PERIOD_MS
          );

          await GameService.updateGameState(
            db,
            gameId,
            {
              "state.status": GameStates.ACTIVE,
              "state.startDate": startDate,
            },
            session
          );
        }

        return newPlayer;
      });

      res.json({ message: "Joined game", player: result });
    } catch (error: any) {
      if (error.message === ERROR_CODES.USER_ALREADY_JOINED_GAME) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.USER_ALREADY_JOINED_GAME });
      }
      if (error.message === ERROR_CODES.GAME_IS_FULL) {
        return res.status(400).json({ errorCode: ERROR_CODES.GAME_IS_FULL });
      }
      if (error.message === ERROR_CODES.GAME_NO_CAPITAL_AVAILABLE) {
        return res
          .status(500)
          .json({ errorCode: ERROR_CODES.GAME_NO_CAPITAL_AVAILABLE });
      }
      if (error.message === ERROR_CODES.GAME_NO_SECOND_PLANET_AVAILABLE) {
        return res
          .status(500)
          .json({ errorCode: ERROR_CODES.GAME_NO_SECOND_PLANET_AVAILABLE });
      }
      if (error.message === ERROR_CODES.GAME_NOT_ENOUGH_SPAWN_HEXES) {
        return res
          .status(500)
          .json({ errorCode: ERROR_CODES.GAME_NOT_ENOUGH_SPAWN_HEXES });
      }

      console.error("Error joining game:", error);
      res.status(500);
    }
  }
);

// POST /api/v1/games/:id/leave
router.post(
  "/:id/leave",
  authenticateToken,
  loadGame,
  requirePendingGame,
  loadPlayer,
  async (req, res) => {
    try {
      await executeInTransaction(async (db, session) => {
        await PlayerService.leaveGame(db, req.player._id, session);
        await PlayerService.removePlayerAssets(db, req.player._id, session);
      });
    } catch (error) {
      console.error("Error leaving game:", error);
      res.status(500);
    }
  }
);

// POST /api/v1/games/:id/concede
router.post(
  "/:id/concede",
  authenticateToken,
  loadGame,
  requireActiveGame,
  loadPlayer,
  async (req, res) => {
    const db = getDb();
    try {
      await PlayerService.concedeGame(
        db,
        req.game._id,
        new ObjectId(req.user.id)
      );
    } catch (error) {
      console.error("Error conceding game:", error);
      res.status(500);
    }
  }
);

// GET /api/v1/games/:id
// Get full game state (with FoW filtering)
router.get(
  "/:id",
  authenticateToken,
  loadGame,
  async (req, res) => {
    const db = getDb();
    try {
      const { response, currentPlayer } = await GameService.getGameState(
        db,
        req.game,
        req.user.id
      );

      if (currentPlayer) {
        req.player = currentPlayer; // Feed this into middleware
      }

      res.json(response);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500);
    }
  },
  touchPlayer
);

// GET /api/v1/games/:id/events
// Get game events (as a player)
router.get("/:id/events", authenticateToken, async (req, res) => {
  const gameId = new ObjectId(req.params.id);

  const db = getDb();
  try {
    // Check if player is in game
    const player = await db.collection("players").findOne({
      gameId: gameId,
      userId: new ObjectId(req.user.id),
    });

    if (!player) {
      return res.status(403).json({ errorCode: ERROR_CODES.USER_NOT_IN_GAME });
    }

    const events = await GameService.getGameEvents(db, gameId);

    res.json(events);
  } catch (error) {
    console.error("Error fetching game events:", error);
    res.status(500);
  }
});

export default router;
