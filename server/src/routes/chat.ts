import express from "express";
import { authenticateToken } from "../middleware/auth";
import {
  CreateConversationRequestSchema,
  SendMessageRequestSchema,
  ERROR_CODES,
  UnifiedId,
} from "@solaris-command/core";
import { loadGame, loadPlayer, validateRequest } from "../middleware";
import { ChatService } from "../services";
import { Types } from "mongoose";

const router = express.Router({ mergeParams: true });

// GET /api/v1/games/:id/conversations
router.get("/", authenticateToken, loadGame, loadPlayer, async (req, res) => {
  try {
    const conversations = await ChatService.getConversations(
      req.game._id,
      req.player._id,
    );

    // TODO: Need a mapping layer.
    res.json({ conversations });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR });
  }
});

// POST /api/v1/games/:id/conversations
router.post(
  "/",
  authenticateToken,
  validateRequest(CreateConversationRequestSchema),
  loadGame,
  loadPlayer,
  async (req, res) => {
    const { name, participantPlayerIds } = req.body;

    // Ensure current player is in participants
    const allParticipants = new Set([
      ...participantPlayerIds,
      String(req.player._id),
    ]);

    const participantList = Array.from(allParticipants).map(
      (id) => new Types.ObjectId(id),
    );

    try {
      const conversation = await ChatService.createConversation(
        req.game._id,
        name || "New Conversation",
        participantList as UnifiedId[],
      );

      // TODO: Need a mapping layer.
      res.status(201).json({ conversation });
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR });
    }
  },
);

// GET /api/v1/games/:id/conversations/:conversationId/messages
router.get(
  "/:conversationId/messages",
  authenticateToken,
  loadGame,
  loadPlayer,
  async (req, res) => {
    const { conversationId } = req.params;

    try {
      const messages = await ChatService.getMessages(
        new Types.ObjectId(conversationId),
        req.player._id,
      );

      // TODO: Need a mapping layer.
      res.json({ messages });
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      if (
        error.message === "Conversation not found" ||
        error.message.includes("not a participant")
      ) {
        return res.status(403).json({ errorCode: ERROR_CODES.FORBIDDEN });
      }
      res.status(500).json({ errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR });
    }
  },
);

// POST /api/v1/games/:id/conversations/:conversationId/messages
router.post(
  "/:conversationId/messages",
  authenticateToken,
  validateRequest(SendMessageRequestSchema),
  loadGame,
  loadPlayer,
  async (req, res) => {
    const { conversationId } = req.params;
    const { content } = req.body;

    try {
      const message = await ChatService.sendMessage(
        req.game._id,
        new Types.ObjectId(conversationId),
        req.player._id,
        content,
      );

      // TODO: Need a mapping layer.
      res.status(201).json({ message });
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (error.message.includes("not a participant")) {
        return res.status(403).json({ errorCode: ERROR_CODES.FORBIDDEN });
      }
      res.status(500).json({ errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR });
    }
  },
);

export default router;
