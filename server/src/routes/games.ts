import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { getDb } from "../db/instance";
import {
  Game,
  GameStates,
  Player,
  Hex,
  Unit,
  Planet,
  Station,
  FogOfWar,
  PlayerStatus,
  CONSTANTS,
} from "@solaris-command/core";
import {
  loadGame,
  requireActiveGame,
  requirePendingGame,
} from "../middleware/game";
import { touchPlayer } from "../middleware";

const router = express.Router();

// GET /api/v1/games
// List open games and my games
router.get("/", authenticateToken, async (req, res) => {
  try {
    const db = getDb();

    // 1. Find games where user is a player
    const myPlayers = await db
      .collection<Player>("players")
      .find({ userId: new ObjectId(req.user.id) })
      .toArray();

    const myGameIds = myPlayers.map((p) => p.gameId);

    // 2. Query Games
    // Return:
    // - Games I am in (regardless of status)
    // - Games that are PENDING (open to join)
    const games = await db
      .collection<Game>("games")
      .find({
        $or: [
          { _id: { $in: myGameIds } },
          { "state.status": GameStates.PENDING },
        ],
      })
      .sort({ "state.startDate": -1 })
      .limit(50)
      .toArray();

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
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/v1/games
// Create a new game (Basic implementation for testing/admin)
// TODO: For MVP let's make a cron job that creates one "official" game at a time. Users should not be able to create games.
router.post("/", authenticateToken, async (req, res) => {
  try {
    const db = getDb();

    // Basic Default Game
    const newGame: any = {
      settings: {
        tickDurationMS: 1000 * 60 * 60, // 1 hour
        ticksPerCycle: 24,
        victoryPointsTarget: 100,
        maxPlayers: 10,
      },
      state: {
        status: GameStates.PENDING,
        tick: 0,
        cycle: 0,
        startDate: new Date(),
        lastTickDate: new Date(),
      },
    };

    const result = await db.collection("games").insertOne(newGame);
    res.json({ id: result.insertedId, ...newGame });
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/v1/games/:id/join
router.post(
  "/:id/join",
  authenticateToken,
  loadGame,
  requirePendingGame,
  async (req, res) => {
    try {
      const db = getDb();

      // Game existence and status checked in middleware

      // Check if already joined
      const existingPlayer = await db.collection<Player>("players").findOne({
        gameId: req.game._id,
        userId: new ObjectId(req.user.id),
      });

      if (existingPlayer) {
        return res.status(400).json({ error: "Already joined this game" });
      }

      // Create Player
      // Note: Actual logic for spawning units/planets usually happens here or when game starts.
      // Assuming for now we just create the player record.

      // Let's create a basic player entry. Spawning might be complex.
      const newPlayer: Player = {
        _id: new ObjectId(),
        gameId: req.game._id,
        userId: new ObjectId(req.user.id),
        alias: req.user.username || "Unknown", // TODO: Request body prop
        color: "#FF0000", // TODO: Request body prop
        status: PlayerStatus.ACTIVE,
        prestigePoints: CONSTANTS.GAME_STARTING_PRESTIGE_POINTS, // TODO: Should be a game setting?
        victoryPoints: 0,
        lastSeenDate: new Date(),
      };

      await db.collection("players").insertOne(newPlayer);

      // TODO: Need to assign a starting location
      // TODO: Need to assign a starting fleet
      // TODO: Need to assign player owned hexes
      // TODO: If the game is full then start it.

      res.json({ message: "Joined game", player: newPlayer });
    } catch (error) {
      console.error("Error joining game:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// POST /api/v1/games/:id/leave
router.post(
  "/:id/leave",
  authenticateToken,
  loadGame,
  requirePendingGame,
  async (req, res) => {
    try {
      const db = getDb();

      const result = await db.collection("players").deleteOne({
        gameId: req.game._id,
        userId: new ObjectId(req.user.id),
      });

      // TODO: Delete units
      // TODO: Delete stations
      // TODO: Remove hex ownerships
      // TODO: Remove planet ownerships
      // TODO: We already do this in `./users` so put it in a controller to it can be shared.

      if (result.deletedCount === 0) {
        return res.status(400).json({ error: "Not a player in this game" });
      }

      res.json({ message: "Left game" });
    } catch (error) {
      console.error("Error leaving game:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// POST /api/v1/games/:id/concede
router.post(
  "/:id/concede",
  authenticateToken,
  loadGame,
  requireActiveGame,
  async (req, res) => {
    try {
      const db = getDb();

      // Update player status to DEFEATED or similar
      const result = await db.collection("players").updateOne(
        {
          gameId: req.game._id,
          userId: req.user.id,
        },
        {
          $set: { status: "DEFEATED" }, // or CONCEDED if the enum supports it
        }
      );

      if (result.matchedCount === 0) {
        return res.status(400).json({ error: "Not a player in this game" });
      }

      // Units are implicitly neutral/inactive when player is defeated.
      // No need to delete them.

      res.json({ message: "Conceded game" });
    } catch (error) {
      console.error("Error conceding game:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// GET /api/v1/games/:id
// Get full game state (with FoW filtering)
router.get("/:id", authenticateToken, loadGame, async (req, res) => {
  try {
    const db = getDb();

    // Load World Data
    // Optimization: Could limit fields or query based on visibility if DB supports it,
    // but for now loading all and filtering in memory as per plan.
    const [players, hexes, allUnits, planets, stations] = await Promise.all([
      db.collection<Player>("players").find({ gameId: req.game._id }).toArray(),
      db.collection<Hex>("hexes").find({ gameId: req.game._id }).toArray(),
      db.collection<Unit>("units").find({ gameId: req.game._id }).toArray(),
      db.collection<Planet>("planets").find({ gameId: req.game._id }).toArray(),
      db
        .collection<Station>("stations")
        .find({ gameId: req.game._id })
        .toArray(),
    ]);

    // Determine if user is a player in this game
    const currentPlayer = players.find((p) => String(p.userId) === req.user.id);

    if (currentPlayer) {
      req.player = currentPlayer // Feed this into middleware
    }

    // TODO: Need mapping layer
    let response: any = {
      game: req.game,
      players,
      hexes, // Hexes are always known
      planets, // Planets are always known
      stations, // Stations are always known
      units: [],
    };

    if (currentPlayer && req.game.state.status === GameStates.ACTIVE) {
      // Apply Fog of War for Units
      const visibleHexes = FogOfWar.getVisibleHexes(
        currentPlayer._id,
        allUnits,
        planets,
        stations
      );

      // Filter Units
      response.units = FogOfWar.filterVisibleUnits(
        currentPlayer._id,
        allUnits,
        visibleHexes
      );
    } else if (req.game.state.status === GameStates.COMPLETED) {
      // Reveal all
      response.units = allUnits;
    } else {
      // Spectator or Pending
      if (req.game.state.status === GameStates.PENDING && currentPlayer) {
        response.units = allUnits.filter(
          (u) => u.playerId.toString() === currentPlayer._id.toString()
        );
      } else {
        // Spectator: See map (hexes, planets, stations) but NO units
        response.units = [];
      }
    }

    res.json(response);
  } catch (error) {
    console.error("Error fetching game:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}, touchPlayer);

// GET /api/v1/games/:id/events
// Get game events (as a player)
router.get("/:id/events", authenticateToken, async (req, res) => {
  const gameId = req.params.id;

  try {
    const db = getDb();

    // Check if player is in game
    const player = await db.collection<Player>("players").findOne({
      gameId: new ObjectId(gameId),
      userId: new ObjectId(req.user.id),
    });

    if (!player) {
      return res.status(403).json({ error: "Must be a player to view events" });
    }

    // Logic: Return events
    // 1. Global events
    // 2. Private events for this player?
    // 3. Combat reports?
    // For now, returning all events for the game as a simple implementation.
    // In future: Filter combat reports to only show if player was involved or had vision.

    const events = await db
      .collection("game_events")
      .find({ gameId: new ObjectId(gameId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    res.json(events);
  } catch (error) {
    console.error("Error fetching game events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
