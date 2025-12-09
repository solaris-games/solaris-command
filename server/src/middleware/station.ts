import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { Station } from "@solaris-command/core";
import { StationService } from "../services/StationService";
import { getDb } from "../db";
import { ERROR_CODES } from "./error-codes";

// Extend Express to include game
declare global {
  namespace Express {
    interface Request {
      station: Station;
      stations: Station[];
    }
  }
}

export const loadPlayerStation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { stationId } = req.params;

  const db = getDb();

  try {
    const station = await StationService.getStationById(
      db,
      new ObjectId(stationId)
    );

    if (!station || station.playerId.toString() !== req.player._id.toString())
      // Make sure the player owns this station.
      return res.status(404).json({ errorCode: ERROR_CODES.STATION_NOT_FOUND });

    req.station = station;

    next();
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500);
  }
};

export const loadStations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { gameId } = req.params;

  const db = getDb();

  try {
    const stations = await StationService.getByGameId(db, new ObjectId(gameId));

    req.stations = stations;

    next();
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500);
  }
};
