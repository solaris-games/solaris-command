import { Request, Response, NextFunction } from "express";
import { ERROR_CODES, Hex } from "@solaris-command/core";
import { HexService } from "../services/HexService";
import { Types } from "mongoose";

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

  try {
    const hexes = await HexService.getByGameId(new Types.ObjectId(gameId));

    req.hexes = hexes;
  } catch (error) {
    console.error("Middleware Error:", error);
    
    return res.status(500).json({ 
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR 
    });
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

  try {
    const hexes = await HexService.getByGameId(new Types.ObjectId(gameId));

    req.hexes = hexes;
  } catch (error) {
    console.error("Middleware Error:", error);
    
    return res.status(500).json({ 
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR 
    });
  }

  next();
};
