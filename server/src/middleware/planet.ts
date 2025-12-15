import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { ERROR_CODES, Planet } from "@solaris-command/core";
import { PlanetService } from "../services/PlanetService";
import { getDb } from "../db";

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

  if (!gameId)
    return res.status(400).json({ errorCode: ERROR_CODES.GAME_ID_REQUIRED });

  const db = getDb();

  try {
    const planets = await PlanetService.getByGameId(db, new ObjectId(gameId));

    req.planets = planets;
  } catch (error) {
    console.error("Middleware Error:", error);
    
    return res.status(500).json({ 
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR 
    });
  }

  next();
};
