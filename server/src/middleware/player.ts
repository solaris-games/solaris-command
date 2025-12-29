import { Request, Response, NextFunction } from "express";
import { ERROR_CODES, Player } from "@solaris-command/core";
import { PlayerService } from "../services";
import { Types } from "mongoose";

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
  const userId = req.user._id;
  const gameId = req.params.id;

  try {
    const player = await PlayerService.getByGameAndUserId(
      new Types.ObjectId(gameId),
      userId
    );

    if (!player)
      return res.status(404).json({ errorCode: ERROR_CODES.PLAYER_NOT_FOUND });

    await PlayerService.touchPlayer(new Types.ObjectId(gameId), player);

    req.player = player;
  } catch (error) {
    console.error("Middleware Error:", error);

    return res.status(500).json({
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
  }

  next();
};
