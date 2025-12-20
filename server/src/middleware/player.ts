import { Request, Response, NextFunction } from "express";
import { getDb } from "../db/instance";
import { ObjectId } from "mongodb";
import { ERROR_CODES, Player } from "@solaris-command/core";
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

    return res.status(500).json({
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
  }

  next();
};

export const touchPlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const gameId = req.params.id;

  // Update the last seen date of the player
  const db = getDb();

  try {
    await PlayerService.touchPlayer(db, new ObjectId(gameId), req.player._id);
  } catch (error) {
    console.error("Middleware Error:", error);

    return res.status(500).json({
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
  }

  next();
};
