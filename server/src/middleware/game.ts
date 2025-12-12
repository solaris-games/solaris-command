import { Request, Response, NextFunction } from "express";
import { getDb } from "../db/instance";
import { ObjectId } from "mongodb";
import { ERROR_CODES, Game, GameStates, Player } from "@solaris-command/core";
import { GameService } from "../services";

// Extend Express to include game
declare global {
  namespace Express {
    interface Request {
      game: Game;
    }
  }
}

export const loadGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const gameId = req.params.id;

  if (!gameId)
    return res.status(400).json({ errorCode: ERROR_CODES.GAME_ID_REQUIRED });

  const db = getDb();

  try {
    const game = await GameService.getById(db, new ObjectId(gameId));

    if (!game)
      return res.status(404).json({ errorCode: ERROR_CODES.GAME_NOT_FOUND });

    req.game = game;
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500);
  }

  next();
};

export const requireActiveGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.game.state.status !== GameStates.ACTIVE) {
    return res.status(400).json({ errorCode: ERROR_CODES.GAME_IS_NOT_ACTIVE });
  }

  next();
};

export const requirePendingGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.game.state.status !== GameStates.PENDING) {
    return res.status(400).json({ errorCode: ERROR_CODES.GAME_IS_NOT_PENDING });
  }

  next();
};
