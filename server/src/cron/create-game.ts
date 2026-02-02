import cron from "node-cron";
import { Types } from "mongoose";
import {
  CONSTANTS,
  GameStates,
  Game,
  GAME_NAMES,
  MapGenerator,
  GAME_MAPS
} from "@solaris-command/core";
import { executeInTransaction } from "../db";
import { GameService, HexService, PlanetService } from "../services";
import { GameModel } from "../db/schemas/game";

export const CreateGameJob = {
  start() {
    const schedule = process.env.CREATE_GAME_SCHEDULE || "*/10 * * * * *"; // Every 10 seconds

    console.log(`⏰ Create Official Game Job scheduled: [${schedule}]`);

    cron.schedule(schedule, async () => {
      try {
        await checkAndCreateGames();
      } catch (err) {
        console.error("🔥 Error in Create Official Game Job:", err);
      }
    });
  },
};

async function checkAndCreateGames() {
  // We want to have an official game for each of these player counts:
  const playerCountPool = [2, 4, 6, 8];

  for (const playerCount of playerCountPool) {
    const maps = GAME_MAPS.filter((map) => map.playerCount === playerCount);

    // Double check we actually have any maps for the target player count yet.
    if (!maps.length) {
      continue;
    }

    // Check for any PENDING game for the target player count.
    const pendingGame = await GameModel.findOne({
      "state.status": GameStates.PENDING,
      "settings.playerCount": playerCount,
    });

    if (pendingGame) {
      // A pending game exists, do nothing
      continue;
    }

    console.log(`Creating new official game for ${playerCount} players...`);

    // Pick a random map from the official pool for the target player count.
    const randomMap = maps[Math.floor(Math.random() * maps.length)];
    const gameName = GAME_NAMES[Math.floor(Math.random() * GAME_NAMES.length)];

    const gameId = new Types.ObjectId();

    const newGameData: Game = {
      _id: gameId,
      mapId: randomMap.id,
      mapName: randomMap.name,
      name: gameName,
      description: "Official Server Game",
      settings: {
        tickDurationMS: CONSTANTS.GAME_DEFAULT_TICK_DURATION_MS,
        ticksPerCycle: CONSTANTS.GAME_DEFAULT_TICKS_PER_CYCLE,
        victoryPointsToWin: randomMap.victoryPointsToWin,
        playerCount,
        combatVersion: "v1",
        movementVersion: "v1",
      },
      state: {
        status: GameStates.PENDING,
        playerCount: 0,
        tick: 0,
        cycle: 0,
        createdDate: new Date(),
        startDate: null,
        endDate: null,
        lastTickDate: null,
        nextTickDate: null,
        nextCycleTickDate: null,
        winnerPlayerId: null,
      },
    };

    const { hexes, planets } = MapGenerator.generateFromGameMap(
      gameId,
      randomMap,
      () => new Types.ObjectId() // ID generator
    );

    await executeInTransaction(async (session) => {
      await GameService.createGame(newGameData, session);
      await HexService.insertHexes(hexes, session);
      await PlanetService.insertPlanets(planets, session);
    });

    console.log(`✅ New official game created for ${playerCount} players.`);
  }
}
