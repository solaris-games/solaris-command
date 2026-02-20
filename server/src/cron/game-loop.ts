import cron from "node-cron";
import {
  Game,
  GameStates,
  Unit,
  Player,
  Hex,
  Planet,
  TickProcessor,
  Station,
  TickContext,
  UnitManager,
  GameLeaderboardUtils,
} from "@solaris-command/core";
import {
  GameService,
  PlayerService,
  SocketService,
  UserService,
} from "../services";
import { executeInTransaction } from "../db/instance";
import {
  GameModel,
  HexModel,
  UnitModel,
  PlayerModel,
  PlanetModel,
  StationModel,
  GameEventModel,
} from "../db/schemas";
import { connectToDb } from "../db/instance";
import { Types } from "mongoose";

// Concurrency Flag: Prevent loop overlapping if processing takes > tick duration
let isProcessing = false;

export const GameLoop = {
  async start() {
    await connectToDb();

    // Default: Run every 10 seconds to check for ticks
    const schedule = process.env.GAME_LOOP_SCHEDULE || "*/10 * * * * *";

    console.log(`⏰ Game Loop scheduled: [${schedule}]`);

    cron.schedule(schedule, async () => {
      if (isProcessing) {
        console.warn("⚠️  Skipping loop: Previous tick still processing.");
        return;
      }

      isProcessing = true;
      try {
        await processActiveGames();
      } catch (err) {
        console.error("🔥 Critical Error in Game Loop:", err);
      } finally {
        isProcessing = false;
      }
    });
  },
};

/**
 * Main Processor: Iterates through all running games
 */
async function processActiveGames() {
  // 1. Find games that are ACTIVE or STARTING
  const activeGames = await GameModel.find({
    "state.status": {
      $in: [GameStates.ACTIVE, GameStates.STARTING],
    },
  }).select({
    _id: 1,
    "state.status": 1,
    "state.startDate": 1,
    "state.nextTickDate": 1,
    "state.tick": 1,
    "settings.tickDurationMS": 1,
  });

  for (const gameId of activeGames) {
    let gameModel: Game | null = null;

    try {
      const now = Date.now();
      const startDate = new Date(gameId.state.startDate!);

      // If the game is currently STARTING then we need to set
      // it to ACTIVE if the starting timer has expired.
      if (
        gameId.state.status === GameStates.STARTING &&
        now >= startDate.getTime()
      ) {
        await GameService.startGame(gameId._id);
        SocketService.publishToGame(gameId._id, "GAME_STARTED", {});
        console.log(`⚡ Game started: ${gameId._id}`);
        return;
      }

      // Is it time for a tick?
      const nextTickDate = new Date(gameId.state.nextTickDate!);
      const isTimeToTick = now >= nextTickDate.getTime();

      let isTickExpidited = false;

      if (!isTimeToTick) {
        // If it isn't time to tick yet, let's check to see if all active players
        // are ready. If so then we can tick early.
        const activePlayers = await PlayerService.countActivePlayers(
          gameId._id,
        );
        const readyPlayers = await PlayerService.countReadyPlayers(gameId._id);

        if (readyPlayers === activePlayers) {
          isTickExpidited = true;
        }
      }

      if (isTimeToTick || isTickExpidited) {
        console.log(
          `⚡ Processing Tick ${gameId.state.tick + 1} for Game ${gameId._id}`,
        );

        // Load the game right at the start of the tick so there is minimal delay.
        gameModel = (await GameService.getById(gameId._id))!;

        // Publish to websocket so that clients are aware that the game tick is currently being processed.
        SocketService.publishToGame(gameModel._id, "TICK_STARTED", {});

        gameModel.state.status = GameStates.LOCKED;

        // Start by locking the game to prevent players from changing the game state
        // during tick processing. We don't know how long ticks will take to
        // process so better to be safe and lock the game now.
        await GameService.lockGame(gameModel._id);

        // If the tick was expidited then we need to move the next tick date to now.
        if (isTickExpidited) {
          gameModel.state.nextTickDate = new Date();
        }

        // Cast Mongoose Document to Game interface if needed, or pass as is if compatible
        await executeGameTick(gameModel);

        const tickEnd = Date.now();
        const totalTime = (tickEnd - now) / 1000;

        // Publish to websocket so that clients can refresh.
        SocketService.publishToGame(gameModel._id, "TICK_COMPLETED", {});

        console.log(`✅ Tick Complete - ${totalTime}s`);
      }
    } catch (err) {
      console.error(`Failed to process game ${gameId._id}:`, err);
      // Continue to next game, don't crash the loop

      // Unlock this game so it can run the tick again.
      await GameService.unlockGame(gameModel._id);
    }
  }
}

/**
 * Execute logic for a single game instance
 */
async function executeGameTick(game: Game) {
  const gameId = game._id;

  // --- A. LOAD STATE (Scatter-Gather) ---
  // We need to load data from multiple collections to build the game state
  // Mongoose models return Query objects. We await them to get Documents.

  let [hexes, units, players, planets, stations] = await Promise.all([
    HexModel.find({ gameId }),
    UnitModel.find({ gameId }),
    PlayerModel.find({ gameId }),
    PlanetModel.find({ gameId }),
    StationModel.find({ gameId }),
  ]);

  // --- B. RUN TICK PROCESSOR (Physics/Combat) ---
  // This calculates moves, battles, and captures based on the loaded state

  // Update tick before we do anything.
  game.state.tick++;

  // Cast Documents to Core types for TickProcessor
  // Mongoose documents technically satisfy the interfaces unless there are hidden fields or methods conflict.
  // The TickProcessor expects arrays of these types.

  const tickContext = new TickContext(
    game,
    players as Player[],
    hexes as Hex[],
    units as Unit[],
    planets as Planet[],
    stations as Station[],
    () => new Types.ObjectId(),
  );

  // Firstly, validate that the game is in a valid state. We should be vigilant and make sure we
  // aren't going to process a game in a broken state, we'd rather NOT tick than process invalid game state.
  TickProcessor.validatePreTickState(tickContext);

  const tickResult = TickProcessor.processTick(tickContext);

  // Get live units so that we can save only those ones (the others will be deleted)
  const liveUnits = units.filter((u) => UnitManager.unitIsAlive(u));
  const deadUnits = units.filter((u) => !UnitManager.unitIsAlive(u));

  updateGameTickDates(game);

  // --- D. PERSISTENCE (Bulk Writes) ---
  // We execute updates in a transaction.

  await executeInTransaction(async (session) => {
    // ----- Save Modified Entities -----
    // Mongoose tracks changes. Update models using bulk operations for better performance.

    // Planets
    if (planets.length > 0) {
      await PlanetModel.bulkSave(planets as any, { session });
    }

    // Units
    if (liveUnits.length > 0) {
      const unitDocs = liveUnits.map((u) => {
        if ((u as any).save == null) {
          return new UnitModel(u);
        }
        return u as any;
      });
      await UnitModel.bulkSave(unitDocs, { session });
    }

    // Hexes
    if (hexes.length > 0) {
      await HexModel.bulkSave(hexes as any, { session });
    }

    // Players (Points updates)
    if (players.length > 0) {
      // TODO: Occasionally fails with error:
      /*
      Failed to process game XXX: MongoServerError: Caused by :: Write conflict during plan execution and yielding is disabled. :: Please retry your operation or multi-document transaction.
      */
      await PlayerModel.bulkSave(players as any, { session });
    }

    // ----- Deletions -----
    if (deadUnits.length > 0) {
      await UnitModel.deleteMany(
        { _id: { $in: deadUnits.map((u) => u._id) } },
        { session },
      );
    }

    if (tickResult.stationsToRemove.length > 0) {
      await StationModel.deleteMany(
        { _id: { $in: tickResult.stationsToRemove } },
        { session },
      );
    }

    // ----- Game State Update -----

    // Note: `game` variable refers to the document.
    // `TickProcessor` methods mutated it.

    // Unlock the game.
    if (game.state.status !== GameStates.COMPLETED) {
      game.state.status = GameStates.ACTIVE;
    }

    const gameDoc = game as any; // Document

    await gameDoc.save({ session });

    // ----- Game Events -----
    if (tickResult.gameEvents.length > 0) {
      await GameEventModel.insertMany(tickResult.gameEvents, { session });
    }

    // ----- User Achievements (Victory) -----
    if (tickResult.winnerPlayerId) {
      const winnerPlayer = players.find(
        (p) => String(p._id) === String(tickResult.winnerPlayerId),
      );

      if (winnerPlayer) {
        await UserService.incrementUserVictories(
          winnerPlayer.userId,
          1,
          session,
        );
      }

      const newUserRankings = GameLeaderboardUtils.calculateGameRankRewards(
        players,
        planets,
        liveUnits,
      );

      for (const newRanking of newUserRankings) {
        await UserService.incrementUserRank(
          newRanking.userId,
          newRanking.rankChange,
          session,
        );
      }
    }
  });

  if (game.state.status === GameStates.COMPLETED) {
    console.log(
      `🏆 Game ${gameId} Completed! Winner: ${game.state.winnerPlayerId}`,
    );
  }
}

function updateGameTickDates(game: Game) {
  // Update the game state tick times:
  game.state.lastTickDate = game.state.nextTickDate; // Prevents clock drift.

  // Calculate the tick date for the next tick.
  let nextTickTime =
    new Date(game.state.lastTickDate).getTime() + game.settings.tickDurationMS;

  game.state.nextTickDate = new Date(nextTickTime);

  // Calculate when the next cycle tick will be
  const nextCycleTick = game.settings.ticksPerCycle * (game.state.cycle + 1);
  const ticksRemainingInCycle = nextCycleTick - game.state.tick;

  game.state.nextCycleTickDate = new Date(
    new Date(game.state.lastTickDate).getTime() +
      game.settings.tickDurationMS * ticksRemainingInCycle,
  );
}
