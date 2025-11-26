import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { MapGenerator, Game, GameStates } from "@solaris-command/core";
import { getDb } from "../db";

export const GameController = {
  async createGame(req: Request, res: Response) {
    try {
      const { name, settings } = req.body;
      const db = getDb();

      const gameId = new ObjectId();

      // 1. Generate World
      const genResult = MapGenerator.generate(gameId, {
        radius: 10, // Hardcoded for now or passed in settings
        playerCount: settings.playerCount || 2,
        density: "MEDIUM",
      });

      // 2. Create Game Object
      const game: Game = {
        _id: gameId,
        playerIds: [],
        name: name || "New Sector",
        description: "A newly discovered sector.",
        state: {
          status: GameStates.PENDING, // Wait for players to join
          tick: 0,
          cycle: 0,
          createdDate: new Date(),
          startDate: null,
          endDate: null,
          lastTickDate: null,
          winnerPlayerId: null,
        },
        settings: {
          playerCount: settings.playerCount || 2,
          ticksPerCycle: 24,
          tickDurationMS: 3600000, // 1 Hour
          victoryPointsToWin: 1000,
          combatVersion: "v1",
          movementVersion: "v1",
        },
      };

      // 3. Bulk Insert Everything
      await db.collection("games").insertOne(game);
      await db.collection("hexes").insertMany(genResult.hexes);
      await db.collection("planets").insertMany(genResult.planets);

      res.status(201).json({
        success: true,
        gameId: gameId,
        message: "Game generated successfully.",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate game." });
    }
  },
};
