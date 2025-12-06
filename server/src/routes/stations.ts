import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { getDb } from "../db/instance";
import { Station, StationStatus } from "@solaris-command/core";
import { validate, BuildStationSchema } from "../middleware/validation";
import { loadGame, loadHexes, loadPlayer, requireActiveGame } from "../middleware";
import { StationService } from "../services/StationService";
import { loadPlayerStation } from "../middleware/station";

const router = express.Router({ mergeParams: true });

// POST /api/v1/games/:id/stations
router.post(
  "/",
  authenticateToken,
  loadGame,
  requireActiveGame,
  loadPlayer,
  loadHexes,
  validate(BuildStationSchema),
  async (req, res) => {
    const { hexId } = req.body;

    try {
      // TODO: Validate that the new station will be in supply, the player
      // cannot construct a station where the hex is out of supply.

      // TODO: Validate that the player can purchase a station (costs prestige)

      // Logic: Build Station
      // 1. Check pool limit (capped by planets)
      // 2. Check resources
      // 3. Create Station in CONSTRUCTING state

      const hex = req.hexes.find(h => String(h._id) === hexId);

      if (!hex) {
        return res.status(400).json({ error: 'Hex ID is invalid.'});
      }

      const newStation: Station = {
        _id: new ObjectId(),
        gameId: req.game._id,
        playerId: req.player._id,
        location: hex.coords,
        status: StationStatus.CONSTRUCTING,
        supply: {
          isInSupply: true,
          isRoot: false,
        },
        // TODO: Need a tickActive and tickDecommissioned
      };

      const createdStation = await StationService.createStation(newStation);

      res.json({
        message: "Station construction started",
        station: createdStation,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// DELETE /api/v1/games/:id/stations/:stationId
router.delete(
  "/:stationId",
  authenticateToken,
  loadPlayer,
  loadPlayerStation,
  async (req, res) => {
    try {
      // Logic: Decommission
      // Sets state to DECOMMISSIONING, doesn't delete immediately?
      // "When a player removes a station, it enters this state for 1 Cycle."

      await StationService.decommissionStation(req.station._id);

      res.json({ message: "Station decommissioning started" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
