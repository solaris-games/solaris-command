import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { ERROR_CODES, Unit, UnitStatus } from "@solaris-command/core";
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

  if (!gameId)
    return res.status(400).json({ errorCode: ERROR_CODES.GAME_ID_REQUIRED });

  const db = getDb();

  try {
    const units = await UnitService.getByGameId(db, new ObjectId(gameId));

    req.units = units;
  } catch (error) {
    console.error("Middleware Error:", error);
    
    return res.status(500).json({ 
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR 
    });
  }

  next();
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

    if (!unit || String(unit.playerId) !== String(req.player._id))
      // Make sure the player owns this unit.
      return res.status(404).json({ errorCode: ERROR_CODES.UNIT_NOT_FOUND });

    req.unit = unit;
  } catch (error) {
    console.error("Middleware Error:", error);
    
    return res.status(500).json({ 
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR 
    });
  }

  next();
};

export const requireNonRegoupingUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.unit.state.status === UnitStatus.REGROUPING) {
    return res.status(400).json({ errorCode: ERROR_CODES.UNIT_IS_REGROUPING });
  }

  next();
};
