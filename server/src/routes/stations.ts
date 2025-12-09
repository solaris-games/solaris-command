import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { CONSTANTS, HexUtils, Station } from "@solaris-command/core";
import { validate, BuildStationSchema } from "../middleware/validation";
import {
  ERROR_CODES,
  loadGame,
  loadHexes,
  loadPlayer,
  requireActiveGame,
} from "../middleware";
import { StationService } from "../services/StationService";
import { loadPlayerStation, loadStations } from "../middleware/station";
import { executeInTransaction, getDb } from "../db";
import { PlayerService } from "../services/PlayerService";

const router = express.Router({ mergeParams: true });

// POST /api/v1/games/:id/stations
router.post(
  "/",
  authenticateToken,
  validate(BuildStationSchema),
  loadGame,
  requireActiveGame,
  loadPlayer,
  loadStations,
  loadHexes,
  async (req, res) => {
    const { hexId } = req.body;

    try {
      // TODO: Validate that the new station will be in supply?

      const hex = req.hexes.find((h) => String(h._id) === hexId);

      if (!hex) {
        return res.status(400).json({ errorCode: ERROR_CODES.HEX_ID_INVALID });
      }

      if (String(hex.playerId) !== String(req.player._id)) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.PLAYER_DOES_NOT_OWN_HEX });
      }

      // Make sure hex isn't already occupied by another station.
      const hexCoordsId = HexUtils.getCoordsID(hex.coords);
      const existingStation = req.stations.find(
        (s) => HexUtils.getCoordsID(s.location) === hexCoordsId
      );

      if (existingStation) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.HEX_OCCUPIED_BY_STATION });
      }

      if (req.player.prestigePoints < CONSTANTS.STATION_PRESTIGE_COST) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.PLAYER_INSUFFICIENT_PRESTIGE });
      }

      const newStation: Station = {
        _id: new ObjectId(),
        gameId: req.game._id,
        playerId: req.player._id,
        location: hex.coords,
        supply: {
          isInSupply: true,
          isRoot: false,
        },
      };

      const createdStation = await executeInTransaction(async (db, session) => {
        const station = await StationService.createStation(
          db,
          newStation,
          session
        );

        await PlayerService.deductPrestigePoints(
          db,
          req.player._id,
          CONSTANTS.STATION_PRESTIGE_COST,
          session
        );

        return station;
      });

      res.json({
        station: createdStation,
        prestigeCost: CONSTANTS.STATION_PRESTIGE_COST
      });
    } catch (error: any) {
      console.error("Error building station:", error);
      res.status(500);
    }
  }
);

// DELETE /api/v1/games/:id/stations/:stationId
router.delete(
  "/:stationId",
  authenticateToken,
  loadGame,
  requireActiveGame,
  loadPlayer,
  loadPlayerStation,
  async (req, res) => {
    const db = getDb();
    try {
      await StationService.deleteStation(db, req.station._id);
    } catch (error: any) {
      console.error("Error decomissioning station:", error);
      res.status(500);
    }
  }
);

export default router;
