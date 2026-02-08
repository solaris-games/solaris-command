import express from "express";
import { authenticateToken } from "../middleware/auth";
import {
  ERROR_CODES,
  CONSTANTS,
  TradePrestigeRequestSchema,
  SendRenownRequestSchema,
  GameEventFactory,
  GameEventTypes,
} from "@solaris-command/core";
import {
  loadGame,
  loadPlayer,
  requireActiveGame,
  requireCompletedGame,
  validateRequest,
} from "../middleware";
import {
  GameService,
  PlayerService,
  SocketService,
  UserService,
} from "../services";
import { executeInTransaction, getDb } from "../db";
import { Types } from "mongoose";

const router = express.Router({ mergeParams: true });

// POST /api/v1/games/:id/players/trade
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
        new Types.ObjectId(targetPlayerId),
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
          session,
        );

        await PlayerService.incrementPrestigePoints(
          req.game._id,
          new Types.ObjectId(targetPlayerId),
          prestige,
          session,
        );

        const eventPayload = {
          fromPlayer: {
            _id: req.player._id,
            alias: req.player.alias,
            color: req.player.color,
          },
          toPlayer: {
            _id: targetPlayer._id,
            alias: targetPlayer.alias,
            color: targetPlayer.color,
          },
          prestige,
        };

        const tradeSenderEvent = await GameService.createGameEvent(
          GameEventFactory.create(
            req.game._id,
            req.player._id, // Sender
            req.game.state.tick,
            req.game.state.cycle,
            GameEventTypes.PLAYERS_TRADED_PRESTIGE,
            eventPayload,
            () => new Types.ObjectId(),
          ),
          session,
        );

        SocketService.publishEventToUser(tradeSenderEvent, req.player.userId);

        const tradeRecipientEvent = await GameService.createGameEvent(
          GameEventFactory.create(
            req.game._id,
            targetPlayer._id, // Recipient
            req.game.state.tick,
            req.game.state.cycle,
            GameEventTypes.PLAYERS_TRADED_PRESTIGE,
            eventPayload,
            () => new Types.ObjectId(),
          ),
          session,
        );

        SocketService.publishEventToUser(
          tradeRecipientEvent,
          targetPlayer.userId,
        );
      });

      res.sendStatus(200);
    } catch (error: any) {
      console.error("Error trading prestige:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

// POST /api/v1/games/:id/players/renown
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
        return res.status(400).json({
          errorCode: ERROR_CODES.PLAYER_INSUFFICIENT_RENOWN_TO_DISTRIBUTE,
        });
      }

      if (String(req.player._id) === targetPlayerId) {
        return res.status(400).json({
          errorCode: ERROR_CODES.PLAYER_CANNOT_SEND_RENOWN_TO_THEMSELVES,
        });
      }

      const targetPlayer = await PlayerService.getByGameAndPlayerId(
        req.game._id,
        new Types.ObjectId(targetPlayerId),
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
          session,
        );

        await UserService.incrementUserRenown(
          targetPlayer.userId,
          renown,
          session,
        );

        const eventPayload = {
          fromPlayer: {
            _id: req.player._id,
            alias: req.player.alias,
            color: req.player.color,
          },
          toPlayer: {
            _id: targetPlayer._id,
            alias: targetPlayer.alias,
            color: targetPlayer.color,
          },
          renown,
        };

        const tradeSenderEvent = await GameService.createGameEvent(
          GameEventFactory.create(
            req.game._id,
            req.player._id, // Sender
            req.game.state.tick,
            req.game.state.cycle,
            GameEventTypes.PLAYERS_TRADED_RENOWN,
            eventPayload,
            () => new Types.ObjectId(),
          ),
          session,
        );

        SocketService.publishEventToUser(tradeSenderEvent, targetPlayer.userId);

        const tradeRecipientEvent = await GameService.createGameEvent(
          GameEventFactory.create(
            req.game._id,
            targetPlayer._id, // Recipient
            req.game.state.tick,
            req.game.state.cycle,
            GameEventTypes.PLAYERS_TRADED_RENOWN,
            eventPayload,
            () => new Types.ObjectId(),
          ),
          session,
        );

        SocketService.publishEventToUser(
          tradeRecipientEvent,
          targetPlayer.userId,
        );
      });

      res.sendStatus(200);
    } catch (error: any) {
      console.error("Error sending renown:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

export default router;
