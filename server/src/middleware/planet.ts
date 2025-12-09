import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { Planet } from "@solaris-command/core";
import { PlanetService } from "../services/PlanetService";
import { getDb } from "../db";
import { ERROR_CODES } from "./error-codes";

// Extend Express to include game
declare global {
  namespace Express {
    interface Request {
      planets: Planet[];
    }
  }
}

export const loadPlanets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const gameId = req.params.id;

  if (!gameId) return res.status(400).json({ errorCode: ERROR_CODES.GAME_ID_REQUIRED });

  const db = getDb();

  try {
    const hexes = await PlanetService.getByGameId(db, new ObjectId(gameId));

    req.planets = hexes;

    next();
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500);
  }
};
