import { Request, Response, NextFunction } from "express";
import { getDb } from "../db/instance";
import { ObjectId } from "mongodb";
import { Player } from "@solaris-command/core";
import { ERROR_CODES } from "./error-codes";
import { PlayerService } from "../services";

// Extend Express to include game
declare global {
  namespace Express {
    interface Request {
      player: Player;
    }
  }
}

export const loadPlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user.id;
  const gameId = req.params.id;

  const db = getDb();

  try {
    const player = await PlayerService.getByGameAndUserId(
      db,
      new ObjectId(gameId),
      new ObjectId(userId)
    );

    if (!player)
      return res.status(404).json({ errorCode: ERROR_CODES.PLAYER_NOT_FOUND });

    req.player = player;
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500);
  }

  next();
};

export const touchPlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Update the last seen date of the player
  const db = getDb();

  try {
    await PlayerService.touchPlayer(db, req.player._id);
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500);
  }

  next();
};
