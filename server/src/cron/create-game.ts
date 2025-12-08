import cron from "node-cron";
import { MongoClient, ObjectId } from "mongodb";
import { CONSTANTS, GameStates, Game, GAME_NAMES } from "@solaris-command/core";
import { GameService } from "../services/GameService";

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

  const now = new Date();

  const gameName = GAME_NAMES[Math.floor(Math.random() * GAME_NAMES.length)];

  const newGameData: Game = {
    _id: new ObjectId(),
    name: gameName,
    description: "Official Server Game",
    settings: {
      tickDurationMS: CONSTANTS.GAME_DEFAULT_TICK_DURATION_MS,
      ticksPerCycle: CONSTANTS.GAME_DEFAULT_TICKS_PER_CYCLE,
      victoryPointsToWin: CONSTANTS.GAME_DEFAULT_VICTORY_POINTS,
      playerCount: CONSTANTS.GAME_DEFAULT_PLAYER_COUNT,
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
      lastTickDate: now,
      winnerPlayerId: null,
    },
  };

  await GameService.createGame(newGameData);
  console.log("✅ New game created.");
}
