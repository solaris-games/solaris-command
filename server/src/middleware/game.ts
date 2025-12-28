import { Request, Response, NextFunction } from "express";
import { ERROR_CODES, Game, GameStates } from "@solaris-command/core";
import { GameService } from "../services";
import { Types } from "mongoose";

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

  try {
    const game = await GameService.getById(new Types.ObjectId(gameId));

    if (!game)
      return res.status(404).json({ errorCode: ERROR_CODES.GAME_NOT_FOUND });

    req.game = game;
  } catch (error) {
    console.error("Middleware Error:", error);
    
    return res.status(500).json({
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
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

export const requireInPlayGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.game.state.status !== GameStates.PENDING && req.game.state.status !== GameStates.ACTIVE && req.game.state.status !== GameStates.STARTING) {
    return res.status(400).json({ errorCode: ERROR_CODES.GAME_IS_NOT_IN_PLAY });
  }

  next();
};

export const requireCompletedGame = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.game.state.status !== GameStates.COMPLETED) {
    return res.status(400).json({ errorCode: ERROR_CODES.GAME_IS_NOT_COMPLETED });
  }

  next();
};
