import express from "express";
import { authenticateToken } from "../middleware/auth";
import { executeInTransaction } from "../db/instance";
import {
  loadGame,
  requireActiveGame,
  requirePendingGame,
} from "../middleware/game";
import { loadPlayer, validateRequest } from "../middleware";
import {
  ERROR_CODES,
  MapUtils,
  CONSTANTS,
  HexUtils,
  GameStates,
  UnitFactory,
  JoinGameRequestSchema,
  GameEventFactory,
  GameEventTypes,
} from "@solaris-command/core";
import {
  GameService,
  GameGalaxyService,
  PlayerService,
  PlanetService,
  HexService,
  UnitService,
  SocketService,
  UserService,
} from "../services";
import { GameMapper, GameGalaxyMapper } from "../map";
import { Types } from "mongoose";

const router = express.Router();

// GET /api/v1/games
// List open games and my games
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { games, myGameIds } = await GameService.listGamesByUser(
      req.user._id
    );

    res.json(GameMapper.toGameListResponse(games, myGameIds));
  } catch (error) {
    console.error("Error listing games:", error);

    return res.status(500).json({
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
  }
});

// POST /api/v1/games/:id/join
router.post(
  "/:id/join",
  authenticateToken,
  validateRequest(JoinGameRequestSchema),
  loadGame,
  requirePendingGame,
  async (req, res) => {
    try {
      const alias = req.body.alias;

      // Check if alias is already taken in the game
      if (await PlayerService.isAliasTaken(req.game._id, alias)) {
        throw new Error(ERROR_CODES.PLAYER_ALIAS_ALREADY_TAKEN);
      }

      // Check if alias matches another user's username
      if (alias.toLowerCase() !== req.user.username.toLowerCase()) {
        const existingUser = await UserService.findByUsernameInsensitive(alias);
        if (existingUser) {
          throw new Error(ERROR_CODES.PLAYER_ALIAS_ALREADY_TAKEN);
        }
      }

      const result = await executeInTransaction(async (session) => {
        const gameId = req.game._id;
        const userId = req.user._id;

        // Check if already joined (Atomic check within transaction not strictly necessary if index unique, but good for logic)
        const existingPlayer = await PlayerService.getByGameAndUserId(
          gameId,
          userId
        );

        if (existingPlayer) {
          throw new Error(ERROR_CODES.USER_ALREADY_JOINED_GAME);
        }

        // Create Player
        const newPlayer = await PlayerService.joinGame(
          gameId,
          userId,
          {
            alias: req.body.alias,
            color: req.body.color,
            renownToDistribute: req.game.settings.playerCount, // Renown = Player limit of the game
          },
          session
        );

        // Assign Capital
        const planets = await PlanetService.getByGameId(gameId);
        const capital = MapUtils.findUnownedCapital(planets);

        if (!capital) {
          throw new Error(ERROR_CODES.GAME_NO_CAPITAL_AVAILABLE);
        }

        await PlanetService.assignPlanetToPlayer(
          req.game._id,
          capital._id,
          newPlayer._id,
          session
        );

        // Assign Starting Fleet
        const hexes = await HexService.getByGameId(gameId);
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
          const unit = UnitFactory.create(
            catalogId,
            newPlayer._id,
            gameId,
            hex._id,
            hex.location,
            () => new Types.ObjectId() // ID Generator
          );

          const createdUnit = await UnitService.createUnit(unit, session);

          // Update Hex
          await HexService.updateHexUnit(
            req.game._id,
            hex._id,
            createdUnit._id,
            session
          );

          await HexService.addUnitToAdjacentHexZOC(
            req.game._id,
            hex,
            unit,
            session
          );
        }

        // Assign Territory (Hex Flipping)
        // Flip neighbor hexes of capital
        const territoryCoords = HexUtils.neighbors(capital.location).concat([
          capital.location,
        ]);
        const territoryIds = new Set(
          territoryCoords.map((c) => HexUtils.getCoordsID(c))
        );

        // Filter hexes that are in this territory
        const territoryHexes = hexes.filter((h) =>
          territoryIds.has(HexUtils.getCoordsID(h.location))
        );

        for (const hex of territoryHexes) {
          if (!MapUtils.isHexImpassable(hex)) {
            await HexService.updateHexOwnership(
              req.game._id,
              hex._id,
              newPlayer._id,
              session
            );
          }
        }

        // Increment (Blind update)
        await GameService.addPlayerCount(gameId, session);

        const joinEvent = await GameService.createGameEvent(
          GameEventFactory.create(
            gameId,
            null,
            req.game.state.tick,
            GameEventTypes.PLAYER_JOINED,
            {
              playerId: newPlayer._id,
              alias: newPlayer.alias,
              color: newPlayer.color,
            },
            () => new Types.ObjectId()
          ),
          session
        );

        // Publish to WebSocket
        SocketService.publishEventToGame(joinEvent);

        // Check Game Start (Using req.game count + 1 for current player)
        // Note: req.game.state.playerCount is old value. We add 1.
        if (req.game.state.playerCount + 1 >= req.game.settings.playerCount) {
          const now = new Date();
          const startDate = new Date(
            now.getTime() + CONSTANTS.GAME_STARTING_WARMUP_PERIOD_MS
          );

          await GameService.updateGameState(
            gameId,
            {
              "state.status": GameStates.ACTIVE,
              "state.startDate": startDate,
            },
            session
          );

          const startEvent = await GameService.createGameEvent(
            GameEventFactory.create(
              gameId,
              null,
              req.game.state.tick,
              GameEventTypes.GAME_STARTED,
              {
                startDate: startDate.toISOString(),
              },
              () => new Types.ObjectId()
            ),
            session
          );

          // Publish to WebSocket
          SocketService.publishEventToGame(startEvent);
        }

        return newPlayer;
      });

      res.json(GameMapper.toJoinGameResponse(result));
    } catch (error: any) {
      if (error.message === ERROR_CODES.USER_ALREADY_JOINED_GAME) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.USER_ALREADY_JOINED_GAME });
      }
      if (error.message === ERROR_CODES.PLAYER_ALIAS_ALREADY_TAKEN) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.PLAYER_ALIAS_ALREADY_TAKEN });
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

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
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
      await executeInTransaction(async (session) => {
        await PlayerService.leaveGame(req.game._id, req.player._id, session);
        await PlayerService.removePlayerAssets(
          req.game._id,
          req.player._id,
          session
        );
        await GameService.deductPlayerCount(req.game._id, session);

        const playerLeftEvent = await GameService.createGameEvent(
          GameEventFactory.create(
            req.game._id,
            null,
            req.game.state.tick,
            GameEventTypes.PLAYER_LEFT,
            {
              playerId: req.player._id,
              alias: req.player.alias,
              color: req.player.color,
            },
            () => new Types.ObjectId()
          ),
          session
        );

        SocketService.publishEventToGame(playerLeftEvent);
      });
    } catch (error) {
      console.error("Error leaving game:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }

    res.json({});
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
    try {
      await executeInTransaction(async (session) => {
        await PlayerService.concedeGame(req.game._id, req.player._id);

        const playerConcededEvent = await GameService.createGameEvent(
          GameEventFactory.create(
            req.game._id,
            null,
            req.game.state.tick,
            GameEventTypes.PLAYER_CONCEDED,
            {
              playerId: req.player._id,
              alias: req.player.alias,
              color: req.player.color,
            },
            () => new Types.ObjectId()
          ),
          session
        );

        SocketService.publishEventToGame(playerConcededEvent);
      });
    } catch (error) {
      console.error("Error conceding game:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }

    return res.json({});
  }
);

// GET /api/v1/games/:id
// Get full game state (with FoW filtering)
router.get("/:id", authenticateToken, loadGame, async (req, res) => {
  try {
    const { galaxy, currentPlayer } = await GameGalaxyService.getGameGalaxy(
      req.game,
      req.user._id
    );

    if (currentPlayer) {
      req.player = currentPlayer; // Feed this into middleware

      // Now touch the player to ensure the last seen date is updated.
      await PlayerService.touchPlayer(req.game._id, req.player);
    }

    const currentPlayerId = currentPlayer?._id || null;

    res.json(GameGalaxyMapper.toGameGalaxyResponse(galaxy, currentPlayerId));
  } catch (error) {
    console.error("Error fetching game:", error);

    return res.status(500).json({
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
  }
});

// GET /api/v1/games/:id/events
// Get game events (as a player)
router.get(
  "/:id/events",
  authenticateToken,
  loadGame,
  loadPlayer,
  async (req, res) => {
    try {
      const events = await GameService.getGameEvents(
        req.game._id,
        req.player._id
      );

      res.json(GameMapper.toGameEventsResponse(events));
    } catch (error) {
      console.error("Error fetching game events:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  }
);

export default router;
