import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import {
  ERROR_CODES,
  CONSTANTS,
  TradePrestigeRequestSchema,
} from "@solaris-command/core";
import {
  loadGame,
  loadPlayer,
  requireActiveGame,
  validateRequest,
} from "../middleware";
import { PlayerService } from "../services";
import { executeInTransaction, getDb } from "../db";

const router = express.Router({ mergeParams: true });

// POST /api/v1/players/trade
router.post(
  "/trade",
  authenticateToken,
  validateRequest(TradePrestigeRequestSchema),
  loadGame,
  requireActiveGame,
  loadPlayer,
  async (req, res) => {
    const {
      targetPlayerId,
      prestige,
    }: { targetPlayerId: string; prestige: number } = req.body;

    const db = getDb();

    try {
      if (req.player.prestigePoints < prestige) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.PLAYER_INSUFFICIENT_PRESTIGE });
      }

      if (String(req.player._id) === targetPlayerId) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.PLAYER_CANNOT_TRADE_WITH_THEMSELVES });
      }

      const targetPlayer = await PlayerService.getByGameAndPlayerId(
        db,
        req.game._id,
        new ObjectId(targetPlayerId)
      );

      if (!targetPlayer) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.PLAYER_NOT_FOUND });
      }

      await executeInTransaction(async (db, session) => {
        await PlayerService.deductPrestigePoints(
          db,
          req.game._id,
          req.player._id,
          prestige,
          session
        );

        await PlayerService.incrementPrestigePoints(
          db,
          req.game._id,
          new ObjectId(targetPlayerId),
          CONSTANTS.STATION_PRESTIGE_COST,
          session
        );
      });
    } catch (error: any) {
      console.error("Error trading prestige:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  }
);

export default router;
