import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { executeInTransaction, getDb } from "../db/instance";
import {
  loadGame,
  requireActiveGame,
  requirePendingGame,
} from "../middleware/game";
import { JoinGameSchema, touchPlayer, validate } from "../middleware";
import { GameService } from "../services/GameService";
import { PlayerService } from "../services/PlayerService";

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
    res.status(500).json({ error: "Internal Server Error" });
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
    const db = getDb();
    try {
      // Check if already joined
      const existingPlayer = await PlayerService.getByGameAndUserId(
        db,
        req.game._id,
        new ObjectId(req.user.id)
      );

      if (existingPlayer) {
        return res.status(400).json({ error: "Already joined this game" });
      }

      const newPlayer = await PlayerService.joinGame(
        db,
        req.game._id,
        new ObjectId(req.user.id),
        {
          alias: req.body.alias,
          color: req.body.color,
        }
      );

      // TODO: Need to assign a starting location
      // TODO: Need to assign a starting fleet
      // TODO: Need to assign player owned hexes
      // TODO: Increment player count in game state
      // TODO: If the game is full then start it

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
    await executeInTransaction(async (db, session) => {
      try {
        const result = await PlayerService.leaveGame(
          db,
          req.game._id,
          new ObjectId(req.user.id),
          session
        );

        if (result.deletedCount === 0) {
          return res.status(400).json({ error: "Not a player in this game" });
        }
      } catch (err: any) {
        if (err.message === "Player not found in this game") {
          return res.status(400).json({ error: "Not a player in this game" });
        }
        throw err;
      }
    });
  }
);

// POST /api/v1/games/:id/concede
router.post(
  "/:id/concede",
  authenticateToken,
  loadGame,
  requireActiveGame,
  async (req, res) => {
    const db = getDb();
    try {
      const result = await PlayerService.concedeGame(
        db,
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
      res.status(500).json({ error: "Internal Server Error" });
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
      return res.status(403).json({ error: "Must be a player to view events" });
    }

    const events = await GameService.getGameEvents(db, gameId);

    res.json(events);
  } catch (error) {
    console.error("Error fetching game events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
