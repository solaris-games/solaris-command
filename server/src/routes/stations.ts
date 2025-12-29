import express from "express";
import { authenticateToken } from "../middleware/auth";
import {
  BuildStationRequestSchema,
  CONSTANTS,
  ERROR_CODES,
  GameEventFactory,
  GameEventTypes,
  HexUtils,
  Station,
  StationFactory,
} from "@solaris-command/core";
import {
  loadGame,
  loadPlayer,
  requireInPlayGame,
  validateRequest,
} from "../middleware";
import {
  StationService,
  PlayerService,
  HexService,
  GameService,
} from "../services";
import { loadPlayerStation, loadStations } from "../middleware/station";
import { executeInTransaction } from "../db";
import { StationMapper } from "../map";
import { Types } from "mongoose";

const router = express.Router({ mergeParams: true });

// POST /api/v1/games/:id/stations
router.post(
  "/",
  authenticateToken,
  validateRequest(BuildStationRequestSchema),
  loadGame,
  requireInPlayGame,
  loadPlayer,
  loadStations,
  async (req, res) => {
    const { hexId }: { hexId: string } = req.body;

    try {
      // TODO: Validate that the new station will be in supply?

      const hex = await HexService.getByGameAndId(
        req.game._id,
        new Types.ObjectId(hexId)
      );

      if (!hex) {
        return res.status(400).json({ errorCode: ERROR_CODES.HEX_ID_INVALID });
      }

      if (String(hex.playerId) !== String(req.player._id)) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.PLAYER_DOES_NOT_OWN_HEX });
      }

      if (hex.planetId != null) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.HEX_OCCUPIED_BY_PLANET });
      }

      // Make sure hex isn't already occupied by another station.
      const hexCoordsId = HexUtils.getCoordsID(hex.location);
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

      const newStation = StationFactory.create(
        req.game._id,
        req.player._id,
        hex._id,
        hex.location,
        () => new Types.ObjectId() as any
      );

      const createdStation = await executeInTransaction(async (session) => {
        const station = await StationService.createStation(newStation, session);

        await HexService.updateHexStation(
          req.game._id,
          hex._id,
          newStation._id,
          session
        );

        await PlayerService.deductPrestigePoints(
          req.game._id,
          req.player._id,
          CONSTANTS.STATION_PRESTIGE_COST,
          session
        );

        await GameService.createGameEvent(
          GameEventFactory.create(
            req.game._id,
            null, // Everyone
            req.game.state.tick,
            GameEventTypes.PLAYER_CONSTRUCTED_STATION,
            {
              stationId: newStation._id,
              playerId: newStation.playerId,
              hexId: newStation.hexId,
              location: newStation.location,
            },
            () => new Types.ObjectId()
          ),
          session
        );

        return station;
      });

      res
        .status(201)
        .json(
          StationMapper.toBuildStationResponse(
            createdStation,
            CONSTANTS.STATION_PRESTIGE_COST
          )
        );
    } catch (error: any) {
      console.error("Error building station:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  }
);

// DELETE /api/v1/games/:id/stations/:stationId
router.delete(
  "/:stationId",
  authenticateToken,
  loadGame,
  requireInPlayGame,
  loadPlayer,
  loadPlayerStation,
  async (req, res) => {
    try {
      await executeInTransaction(async (session) => {
        await StationService.deleteStation(req.game._id, req.station._id);

        await HexService.updateHexStation(
          req.game._id,
          req.station.hexId,
          null
        );

        await GameService.createGameEvent(
          GameEventFactory.create(
            req.game._id,
            null, // Everyone
            req.game.state.tick,
            GameEventTypes.PLAYER_DECOMMISSIONED_STATION,
            {
              stationId: req.station._id,
              playerId: req.station.playerId,
              hexId: req.station.hexId,
              location: req.station.location,
            },
            () => new Types.ObjectId()
          ),
          session
        );
      });
    } catch (error: any) {
      console.error("Error decomissioning station:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }

    res.json({});
  }
);

export default router;
