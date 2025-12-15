import cron from "node-cron";
import { MongoClient, ObjectId } from "mongodb";
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

export const CreateGameJob = {
  start(mongoClient: MongoClient) {
    // Check every minute
    const schedule = process.env.CREATE_GAME_SCHEDULE || "* * * * *";

    console.log(`⏰ Create Official Game Job scheduled: [${schedule}]`);

    cron.schedule(schedule, async () => {
      try {
        await checkAndCreateGame(mongoClient);
      } catch (err) {
        console.error("🔥 Error in Create Official Game Job:", err);
      }
    });
  },
};

async function checkAndCreateGame(client: MongoClient) {
  const db = client.db();

  // Check for any PENDING games
  const pendingGame = await db.collection<Game>("games").findOne({
    "state.status": GameStates.PENDING,
  });

  if (pendingGame) {
    // A pending game exists, do nothing
    return;
  }

  console.log("Creating new Offical Game...");

  const map = GAME_MAPS[0] // TODO: Pick a random map from an 'official' pool.

  const gameName = GAME_NAMES[Math.floor(Math.random() * GAME_NAMES.length)];

  const gameId = new ObjectId();

  const newGameData: Game = {
    _id: gameId,
    mapId: map.id,
    name: gameName,
    description: "Official Server Game",
    settings: {
      tickDurationMS: CONSTANTS.GAME_DEFAULT_TICK_DURATION_MS,
      ticksPerCycle: CONSTANTS.GAME_DEFAULT_TICKS_PER_CYCLE,
      victoryPointsToWin: CONSTANTS.GAME_DEFAULT_VICTORY_POINTS, // TODO: Move into map?
      playerCount: map.playerCount,
      combatVersion: "v1",
      movementVersion: "v1",
    },
    state: {
      status: GameStates.PENDING,
      playerCount: map.playerCount,
      tick: 0,
      cycle: 0,
      createdDate: new Date(),
      startDate: null,
      endDate: null,
      lastTickDate: null,
      winnerPlayerId: null,
    },
  };

  const { hexes, planets } = MapGenerator.generateFromGameMap(gameId, map);

  await executeInTransaction(async (db, session) => {
    await GameService.createGame(db, newGameData);
    await HexService.insertHexes(db, hexes);
    await PlanetService.insertPlanets(db, planets);
  });

  console.log("✅ New game created.");
}
