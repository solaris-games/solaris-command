import express from "express";
import { authenticateToken } from "../middleware/auth";
import {
  ERROR_CODES,
  CONSTANTS,
  TradePrestigeRequestSchema,
  SendRenownRequestSchema,
} from "@solaris-command/core";
import {
  loadGame,
  loadPlayer,
  requireActiveGame,
  requireCompletedGame,
  validateRequest,
} from "../middleware";
import { PlayerService, UserService } from "../services";
import { executeInTransaction, getDb } from "../db";
import { Types } from "mongoose";

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
        req.game._id,
        new Types.ObjectId(targetPlayerId)
      );

      if (!targetPlayer) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.PLAYER_NOT_FOUND });
      }

      await executeInTransaction(async (session) => {
        await PlayerService.deductPrestigePoints(
          req.game._id,
          req.player._id,
          prestige,
          session
        );

        await PlayerService.incrementPrestigePoints(
          req.game._id,
          new Types.ObjectId(targetPlayerId),
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

// POST /api/v1/players/renown
router.post(
  "/renown",
  authenticateToken,
  validateRequest(SendRenownRequestSchema),
  loadGame,
  requireCompletedGame,
  loadPlayer,
  async (req, res) => {
    const {
      targetPlayerId,
      renown,
    }: { targetPlayerId: string; renown: number } = req.body;

    try {
      if (req.player.renownToDistribute < renown) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.PLAYER_INSUFFICIENT_RENOWN_TO_DISTRIBUTE });
      }

      if (String(req.player._id) === targetPlayerId) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.PLAYER_CANNOT_SEND_RENOWN_TO_THEMSELVES });
      }

      const targetPlayer = await PlayerService.getByGameAndPlayerId(
        req.game._id,
        new Types.ObjectId(targetPlayerId)
      );

      if (!targetPlayer) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.PLAYER_NOT_FOUND });
      }

      await executeInTransaction(async (session) => {
        await PlayerService.deductRenownToDistrubute(
          req.game._id,
          req.player._id,
          renown,
          session
        );

        await UserService.incrementUserRenown(
          targetPlayer.userId,
          renown,
          session
        );
      });
    } catch (error: any) {
      console.error("Error sending renown:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  }
);

export default router;
