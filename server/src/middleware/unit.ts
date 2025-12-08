import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { Unit, UnitStatus } from "@solaris-command/core";
import { UnitService } from "../services/UnitService";
import { getDb } from "../db";

// Extend Express to include game
declare global {
  namespace Express {
    interface Request {
      unit: Unit;
      units: Unit[];
    }
  }
}

export const loadUnits = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const gameId = req.params.id;

  if (!gameId) return res.status(400).json({ error: "Game ID required" });

  const db = getDb();

  try {
    const units = await UnitService.getByGameId(db, new ObjectId(gameId));

    req.units = units;

    next();
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const loadPlayerUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { unitId } = req.params;

  try {
    const db = getDb();

    const unit = await UnitService.getUnitById(db, new ObjectId(unitId));

    if (!unit || unit.playerId.toString() !== req.player._id.toString())
      // Make sure the player owns this unit.
      return res.status(404).json({ error: "Unit not found" });

    req.unit = unit;

    next();
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const requireNonRegoupingUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.unit.state.status === UnitStatus.REGROUPING) {
    return res.status(400).json({ error: "Unit is regrouping." });
  }

  next();
};
