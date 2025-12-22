import { Request, Response, NextFunction } from "express";
import { ERROR_CODES, Station } from "@solaris-command/core";
import { StationService } from "../services/StationService";
import { Types } from "mongoose";

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
  const { id, stationId } = req.params;

  try {
    const station = await StationService.getStationById(
      new Types.ObjectId(id),
      new Types.ObjectId(stationId)
    );

    if (!station || String(station.playerId) !== String(req.player._id))
      // Make sure the player owns this station.
      return res.status(404).json({ errorCode: ERROR_CODES.STATION_NOT_FOUND });

    req.station = station;
  } catch (error) {
    console.error("Middleware Error:", error);
    
    return res.status(500).json({ 
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR 
    });
  }

  next();
};

export const loadStations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const stations = await StationService.getByGameId(new Types.ObjectId(id));

    req.stations = stations;
  } catch (error) {
    console.error("Middleware Error:", error);
    
    return res.status(500).json({ 
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR 
    });
  }

  next();
};
