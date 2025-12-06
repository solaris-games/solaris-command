import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { Hex } from "@solaris-command/core";
import { HexService } from "../services/HexService";

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

  if (!gameId) return res.status(400).json({ error: "Game ID required" });

  try {
    const hexes = await HexService.getByGameId(new ObjectId(gameId));

    req.hexes = hexes;

    next();
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
