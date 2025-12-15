import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { ERROR_CODES, Hex } from "@solaris-command/core";
import { HexService } from "../services/HexService";
import { getDb } from "../db";

// Extend Express to include game
declare global {
  namespace Express {
    interface Request {
      hexes: Hex[];
    }
  }
}

export const loadHexes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const gameId = req.params.id;

  if (!gameId)
    return res.status(400).json({ errorCode: ERROR_CODES.GAME_ID_REQUIRED });

  const db = getDb();

  try {
    const hexes = await HexService.getByGameId(db, new ObjectId(gameId));

    req.hexes = hexes;
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500);
  }

  next();
};

export const loadPlayerHexes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const gameId = req.params.id;

  if (!gameId)
    return res.status(400).json({ errorCode: ERROR_CODES.GAME_ID_REQUIRED });

  const db = getDb();

  try {
    const hexes = await HexService.getByGameId(db, new ObjectId(gameId));

    req.hexes = hexes;
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500);
  }

  next();
};
