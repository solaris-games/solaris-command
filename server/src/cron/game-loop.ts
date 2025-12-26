import cron from "node-cron";
import {
  Game,
  GameStates,
  Unit,
  Player,
  Hex,
  Planet,
  TickProcessor,
  ProcessCycleResult,
  Station,
  TickContext,
  CycleTickContext,
  PostTickContext,
} from "@solaris-command/core";
import { GameService } from "../services";
import { executeInTransaction } from "../db/instance";
import {
  GameModel,
  HexModel,
  UnitModel,
  PlayerModel,
  PlanetModel,
  StationModel,
  GameEventModel,
  UserModel,
} from "../db/schemas";
import { connectToDb } from "../db/instance";

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
  // 1. Find games that are ACTIVE
  const activeGames = await GameModel.find({
    "state.status": GameStates.ACTIVE,
  }).select({
    _id: 1,
    "state.startDate": 1,
    "state.tick": 1,
    "settings.tickDurationMS": 1,
  });

  for (const gameId of activeGames) {
    try {
      // 2. Time Check: Is it time for a tick?
      // Logic: Start Date + (Tick Count * Tick Duration)
      // This prevents clock drift compared to just adding to 'lastTickDate'
      const nextTickTime =
        new Date(gameId.state.startDate!).getTime() +
        (gameId.state.tick + 1) * gameId.settings.tickDurationMS;
      const now = Date.now();

      if (now >= nextTickTime) {
        console.log(
          `⚡ Processing Tick ${gameId.state.tick + 1} for Game ${gameId._id}`
        );

        // Load the game right at the start of the tick so there is minimal delay.
        const game = (await GameService.getById(gameId._id))!;

        game.state.lastTickDate = new Date(nextTickTime); // Set the tick time here to prevent clock drift
        game.state.status = GameStates.LOCKED;

        // Start by locking the game to prevent players from changing the game state
        // during tick processing. We don't know how long ticks will take to
        // process so better to be safe and lock the game now.
        await GameService.lockGame(game._id);

        // Cast Mongoose Document to Game interface if needed, or pass as is if compatible
        await executeGameTick(game as Game);

        const tickEnd = Date.now();
        const totalTime = (tickEnd - now) / 1000;

        console.log(`✅ Tick Complete - ${totalTime}s`);
      }
    } catch (err) {
      console.error(`Failed to process game ${gameId._id}:`, err);
      // Continue to next game, don't crash the loop
    } finally {
      if (gameId.state.status !== GameStates.COMPLETED) {
        await GameService.unlockGame(gameId._id);
      }
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
    stations as Station[]
  );

  // Firstly, validate that the game is in a valid state. We should be vigilant and make sure we
  // aren't going to process a game in a broken state, we'd rather NOT tick than process invalid game state.
  TickProcessor.validateGameState(tickContext);

  const tickResult = TickProcessor.processTick(tickContext);

  // --- C. CHECK FOR CYCLE (Economy) ---
  // If this new tick completes a cycle (e.g., tick 24, 48...)
  const isCycleComplete = game.state.tick % game.settings.ticksPerCycle === 0;

  let cycleResult: ProcessCycleResult | null = null;

  if (isCycleComplete) {
    console.log(
      `💰 Processing Cycle ${game.state.cycle + 1} for Game ${gameId}`
    );

    // IMPORTANT: Apply the Tick updates to our memory objects BEFORE running Cycle logic
    // so supply calculations use the new positions/ownerships and delete units/stations that are
    // no longer present in the game.

    // Remove dead entities from arrays so they aren't processed in cycle
    units = units.filter(
      (u) =>
        !tickResult.unitsToRemove.some((id) => String(id) === String(u._id))
    );

    stations = stations.filter(
      (s) =>
        !tickResult.stationsToRemove.some((id) => String(id) === String(s._id))
    );

    // Run the Economy/Logistics Logic
    const cycleContext = new CycleTickContext(
      game,
      players as Player[],
      hexes as Hex[],
      units as Unit[],
      planets as Planet[],
      stations as Station[]
    );

    cycleResult = TickProcessor.processCycle(cycleContext);
  }

  // Units (Only live ones)
  // Note: units array was filtered above for Cycle processing if cycle happened.
  // If not cycle, we should still filter out dead ones before saving?
  // tickResult.unitsToRemove contains IDs of units to be deleted.
  // We should NOT save those.
  // Filter again to be safe.
  const liveUnits = units.filter(
    (u) => !tickResult.unitsToRemove.some((id) => String(id) === String(u._id))
  );
  // Also filter out units starved in cycle
  const cycleDeadUnits = cycleResult ? cycleResult.unitsToDelete : [];
  const finalLiveUnits = liveUnits.filter(
    (u) => !cycleDeadUnits.some((id) => String(id) === String(u._id))
  );

  // Process post tick actions, e.g reset ZOC influence
  const postTickContext = new PostTickContext(hexes, finalLiveUnits);

  TickProcessor.processPostTick(postTickContext);

  // --- D. PERSISTENCE (Bulk Writes) ---
  // We execute updates in a transaction.

  await executeInTransaction(async (session) => {
    // ----- Save Modified Entities -----
    // Mongoose tracks changes. calling .save() only writes if modified.
    // Update models sequentially, transactions do not support parallel operations.

    // Planets
    for (const planet of planets) {
      await planet.save({ session });
    }

    // Units
    for (const unit of finalLiveUnits) {
      await unit.save({ session });
    }

    // Hexes
    for (const hex of hexes) {
      await hex.save({ session });
    }

    // Players (Points updates)
    for (const player of players) {
      await player.save({ session });
    }

    // ----- Deletions -----
    const unitsToDelete = [...tickResult.unitsToRemove];
    const stationsToDelete = [...tickResult.stationsToRemove];

    if (cycleResult) {
      cycleResult.unitsToDelete.forEach((id) => unitsToDelete.push(id));
    }

    // TODO: I think these queries are messing up the transactions:
    // MongoServerError: Transaction with { txnNumber: 6 } has been committed.
    // MongoServerError: Given transaction number 9 does not match any in-progress transactions. The active transaction number is 8
    if (unitsToDelete.length > 0) {
      await UnitModel.deleteMany({ _id: { $in: unitsToDelete } }, { session });
    }

    if (stationsToDelete.length > 0) {
      await StationModel.deleteMany(
        { _id: { $in: stationsToDelete } },
        { session }
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

    // ----- Combat Reports -----
    if (tickResult.combatReports.length > 0) {
      for (const report of tickResult.combatReports) {
        const attackerReport = new GameEventModel({
          gameId: gameId,
          playerId: report.attackerId, // One for the attacker
          tick: game.state.tick,
          type: "COMBAT_REPORT", // TODO: Need a type for this
          data: report,
        });

        await attackerReport.save();

        const defenderReport = new GameEventModel({
          gameId: gameId,
          playerId: report.defenderId, // Another event for the defender
          tick: game.state.tick,
          type: "COMBAT_REPORT",
          data: report,
        });

        await defenderReport.save();
      }
    }

    // ----- User Achievements (Victory) -----
    if (cycleResult && cycleResult.winnerPlayerId) {
      const winnerPlayer = players.find(
        (p) => String(p._id) === String(cycleResult.winnerPlayerId)
      );

      if (winnerPlayer) {
        await UserModel.updateOne(
          { _id: winnerPlayer.userId },
          { $inc: { "achievements.victories": 1 } },
          { session }
        ).session(session);
      }
    }
  });

  if (game.state.status === GameStates.COMPLETED) {
    console.log(
      `🏆 Game ${gameId} Completed! Winner: ${game.state.winnerPlayerId}`
    );
  }
}
