import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { Station } from "@solaris-command/core";
import { StationService } from "../services/StationService";

// Extend Express to include game
declare global {
  namespace Express {
    interface Request {
      station: Station;
    }
  }
}

export const loadPlayerStation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { stationId } = req.params;

  try {
    const station = await StationService.getStationById(
      new ObjectId(stationId)
    );

    if (!station || station.playerId.toString() !== req.player._id.toString())
      // Make sure the player owns this station.
      return res.status(404).json({ error: "Station not found" });

    req.station = station;

    next();
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
