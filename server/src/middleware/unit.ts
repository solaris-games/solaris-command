import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { Unit, UnitStatus } from "@solaris-command/core";
import { UnitService } from "../services/UnitService";

// Extend Express to include game
declare global {
  namespace Express {
    interface Request {
      unit: Unit;
    }
  }
}

export const loadPlayerUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { unitId } = req.params;

  try {
    const unit = await UnitService.getUnitById(new ObjectId(unitId));

    if (!unit || unit.playerId.toString() !== req.player._id.toString()) // Make sure the player owns this unit.
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
