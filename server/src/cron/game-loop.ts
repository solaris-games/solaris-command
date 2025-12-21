import cron from "node-cron";
import {
  MongoClient,
  ObjectId,
  AnyBulkWriteOperation,
  BulkWriteResult,
  DeleteResult,
} from "mongodb";
import { Types } from "mongoose";
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
  GameEvent,
  User,
  TickContext,
  CycleTickContext,
} from "@solaris-command/core";
import { GameService } from "../services";
import { executeInTransaction } from "../db/instance";
import { GameModel } from "../db/schemas/game";
import { HexModel } from "../db/schemas/hex";
import { UnitModel } from "../db/schemas/unit";
import { PlayerModel } from "../db/schemas/player";
import { PlanetModel } from "../db/schemas/planet";
import { StationModel } from "../db/schemas/station";
import { GameEventModel } from "../db/schemas/game-event";
import { UserModel } from "../db/schemas/user";
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
  });

  for (const game of activeGames) {
    try {
      // 2. Time Check: Is it time for a tick?
      // Logic: Start Date + (Tick Count * Tick Duration)
      // This prevents clock drift compared to just adding to 'lastTickDate'
      const nextTickTime =
        new Date(game.state.startDate!).getTime() +
        (game.state.tick + 1) * game.settings.tickDurationMS;
      const now = Date.now();

      if (now >= nextTickTime) {
        console.log(
          `⚡ Processing Tick ${game.state.tick + 1} for Game ${game._id}`
        );
        // Cast Mongoose Document to Game interface if needed, or pass as is if compatible
        await executeGameTick(game as unknown as Game);
      }
    } catch (err) {
      console.error(`Failed to process game ${game._id}:`, err);
      // Continue to next game, don't crash the loop
    }
  }
}

/**
 * Execute logic for a single game instance
 */
async function executeGameTick(game: Game) {
  const gameId = game._id as unknown as Types.ObjectId;

  // Start by locking the game to prevent players from changing the game state
  // during tick processing. We don't know how long ticks will take to
  // process so better to be safe and lock the game now.
  await GameService.lockGame(gameId);

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

  // Cast Documents to Core types for TickProcessor
  // Mongoose documents technically satisfy the interfaces unless there are hidden fields or methods conflict.
  // The TickProcessor expects arrays of these types.

  // --- B. RUN TICK PROCESSOR (Physics/Combat) ---
  // This calculates moves, battles, and captures based on the loaded state

  // Update tick directly on the object as requested.
  game.state.tick++;
  const newTick = game.state.tick;

  const tickContext = new TickContext(
    newTick,
    game,
    players as unknown as Player[],
    hexes as unknown as Hex[],
    units as unknown as Unit[],
    planets as unknown as Planet[],
    stations as unknown as Station[]
  );

  const tickResult = TickProcessor.processTick(tickContext);

  // --- C. CHECK FOR CYCLE (Economy) ---
  // If this new tick completes a cycle (e.g., tick 24, 48...)
  const isCycleComplete = newTick % game.settings.ticksPerCycle === 0;

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
      players as unknown as Player[],
      hexes as unknown as Hex[],
      units as unknown as Unit[],
      planets as unknown as Planet[],
      stations as unknown as Station[]
    );

    cycleResult = TickProcessor.processCycle(cycleContext);
  }

  // --- D. PERSISTENCE (Bulk Writes) ---
  // We execute updates in a transaction.

  await executeInTransaction(async (session) => {

    const savePromises: Promise<any>[] = [];

    // 1. Save Modified Entities
    // Mongoose tracks changes. calling .save() only writes if modified.

    // Planets
    planets.forEach(p => savePromises.push(p.save({ session })));

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

    finalLiveUnits.forEach(u => savePromises.push(u.save({ session })));

    // Hexes
    hexes.forEach(h => savePromises.push(h.save({ session })));

    // Players (Points updates)
    players.forEach(p => savePromises.push(p.save({ session })));


    // 2. Deletions
    const unitsToDelete = [...tickResult.unitsToRemove];
    const stationsToDelete = [...tickResult.stationsToRemove];

    if (cycleResult) {
        cycleResult.unitsToDelete.forEach(id => unitsToDelete.push(id));
    }

    if (unitsToDelete.length > 0) {
        savePromises.push(UnitModel.deleteMany({ _id: { $in: unitsToDelete } }, { session }));
    }

    if (stationsToDelete.length > 0) {
        savePromises.push(StationModel.deleteMany({ _id: { $in: stationsToDelete } }, { session }));
    }

    // 3. Game State Update

    // Update Tick (redundant assignment since we modified object, but explicit for clarity)
    game.state.tick = newTick;
    game.state.lastTickDate = new Date();

    // Unlock Game
    if (game.state.status === GameStates.LOCKED) {
        game.state.status = GameStates.ACTIVE;
    }

    // Note: `game` variable refers to the document.
    // `TickProcessor` methods mutated it.

    const gameDoc = game as any; // Document
    savePromises.push(gameDoc.save({ session }));


    // 4. Combat Reports
    if (tickResult.combatReports.length > 0) {
        const events = [];

        tickResult.combatReports.forEach(r => {
            events.push({
                gameId: gameId,
                playerId: r.attackerId,
                tick: newTick,
                type: "COMBAT_REPORT",
                data: r,
                // createdAt handled by schema timestamp or default
            });
             events.push({
                gameId: gameId,
                playerId: r.defenderId,
                tick: newTick,
                type: "COMBAT_REPORT",
                data: r,
            });
        });

        savePromises.push(GameEventModel.insertMany(events, { session }));
    }

    // 5. User Achievements (Victory)
    if (cycleResult && cycleResult.winnerPlayerId) {
         const winnerPlayer = players.find(
            (p) => String(p._id) === String(cycleResult.winnerPlayerId)
          );

          if (winnerPlayer) {
              savePromises.push(
                  UserModel.updateOne(
                      { _id: winnerPlayer.userId },
                      { $inc: { "achievements.victories": 1 } },
                      { session }
                  )
              );
          }
    }

    await Promise.all(savePromises);
  });

  const finalGameState = game.state;
  if (finalGameState.status === GameStates.COMPLETED) {
    console.log(
      `🏆 Game ${gameId} Completed! Winner: ${finalGameState.winnerPlayerId}`
    );
  }

  console.log(`✅ Tick Complete.`);
}
