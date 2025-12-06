import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { getDb } from "../db/instance";
import {
  loadGame,
  requireActiveGame,
  requirePendingGame,
} from "../middleware/game";
import { touchPlayer } from "../middleware";
import { GameService } from "../services/GameService";
import { PlayerService } from "../services/PlayerService";
import { GameStates } from "@solaris-command/core";

const router = express.Router();

// GET /api/v1/games
// List open games and my games
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { games, myGameIds } = await GameService.listGames(
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
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/v1/games
// Create a new game (Basic implementation for testing/admin)
// TODO: For MVP let's make a cron job that creates one "official" game at a time. Users should not be able to create games.
router.post("/", authenticateToken, async (req, res) => {
  try {
    // Basic Default Game
    const newGameData: any = {
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

    const result = await GameService.createGame(newGameData);
    res.json(result);
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
      // Check if already joined
      const existingPlayer = await db.collection("players").findOne({
        gameId: req.game._id,
        userId: new ObjectId(req.user.id),
      });

      if (existingPlayer) {
        return res.status(400).json({ error: "Already joined this game" });
      }

      const newPlayer = await PlayerService.joinGame(
        req.game._id,
        new ObjectId(req.user.id),
        {
          username: req.user.username,
          // color: ... // TODO request body
        }
      );

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
    const db = getDb();
    const session = db.client.startSession();

    try {
      session.startTransaction();

      try {
          const result = await PlayerService.leaveGame(
              req.game._id,
              new ObjectId(req.user.id),
              session
          );

          if (result.deletedCount === 0) {
              await session.abortTransaction();
              return res.status(400).json({ error: "Not a player in this game" });
          }
      } catch (err: any) {
          if (err.message === "Player not found in this game") {
               await session.abortTransaction();
               return res.status(400).json({ error: "Not a player in this game" });
          }
          throw err;
      }

      await session.commitTransaction();
      res.json({ message: "Left game" });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error leaving game:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      await session.endSession();
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
      const result = await PlayerService.concedeGame(
          req.game._id,
          new ObjectId(req.user.id)
      );

      if (result.matchedCount === 0) {
        return res.status(400).json({ error: "Not a player in this game" });
      }

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
    const { response, currentPlayer } = await GameService.getGameState(
        req.game,
        req.user.id
    );

    if (currentPlayer) {
      req.player = currentPlayer; // Feed this into middleware
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
  const gameId = new ObjectId(req.params.id);

  try {
    const db = getDb();

    // Check if player is in game
    const player = await db.collection("players").findOne({
      gameId: gameId,
      userId: new ObjectId(req.user.id),
    });

    if (!player) {
      return res.status(403).json({ error: "Must be a player to view events" });
    }

    const events = await GameService.getGameEvents(gameId);

    res.json(events);
  } catch (error) {
    console.error("Error fetching game events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
