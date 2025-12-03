import { Request, Response, NextFunction } from "express";
import { getDb } from "../db/instance";
import { ObjectId } from "mongodb";
import { Game, GameStates, Player } from "@solaris-command/core";

// Extend Express to include game
declare global {
  namespace Express {
    interface Request {
      game: Game;
      player: Player;
    }
  }
}

export const loadGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const gameId = req.params.id;

  if (!gameId) return res.status(400).json({ error: "Game ID required" });

  try {
    const db = getDb();
    const game = await db
      .collection<Game>("games")
      .findOne({ _id: new ObjectId(gameId) });

    if (!game) return res.status(404).json({ error: "Game not found" });

    req.game = game;

    next();
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const requireActiveGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.game.state.status !== GameStates.ACTIVE) {
    return res.status(400).json({ error: "Game is not active" });
  }

  next();
};

export const requirePendingGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.game.state.status !== GameStates.PENDING) {
    return res.status(400).json({ error: "Game is not in pending state" });
  }

  next();
};
