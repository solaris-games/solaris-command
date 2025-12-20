import cron from "node-cron";
import {
  MongoClient,
  ObjectId,
  AnyBulkWriteOperation,
  BulkWriteResult,
  DeleteResult,
} from "mongodb";
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
  TickContextHexUpdateTracker,
  TickContext,
  CycleTickContext,
} from "@solaris-command/core";
import { GameService } from "../services";
import { executeInTransaction } from "../db/instance";

// Concurrency Flag: Prevent loop overlapping if processing takes > tick duration
let isProcessing = false;

export const GameLoop = {
  start(mongoClient: MongoClient) {
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
        await processActiveGames(mongoClient);
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
async function processActiveGames(client: MongoClient) {
  const db = client.db();

  // 1. Find games that are ACTIVE
  const activeGames = await db
    .collection<Game>("games")
    .find({
      "state.status": GameStates.ACTIVE,
    })
    .toArray();

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
        await executeGameTick(client, game);
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
async function executeGameTick(client: MongoClient, game: Game) {
  const db = client.db();
  const gameId = game._id;

  // Start by locking the game to prevent players from changing the game state
  // during tick processing. We don't know how long ticks will take to
  // process so better to be safe and lock the game now.
  await GameService.lockGame(db, gameId);

  // --- A. LOAD STATE (Scatter-Gather) ---
  // We need to load data from multiple collections to build the game state

  let [hexes, units, players, planets, stations] = await Promise.all([
    db.collection<Hex>("hexes").find({ gameId: gameId }).toArray(),
    db.collection<Unit>("units").find({ gameId: gameId }).toArray(),
    db.collection<Player>("players").find({ gameId: gameId }).toArray(),
    db.collection<Planet>("planets").find({ gameId: gameId }).toArray(),
    db.collection<Station>("stations").find({ gameId: gameId }).toArray(),
  ]);

  const hexUpdateTracker = new TickContextHexUpdateTracker();

  hexUpdateTracker.refreshHexesToUpdate(planets, stations, units); // Start tracking hexes

  // --- B. RUN TICK PROCESSOR (Physics/Combat) ---
  // This calculates moves, battles, and captures based on the loaded state
  const newTick = game.state.tick + 1;

  const tickContext = new TickContext(
    newTick,
    game,
    players,
    hexes,
    units,
    planets,
    stations
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
      players,
      hexes,
      units,
      planets,
      stations
    );

    cycleResult = TickProcessor.processCycle(cycleContext);
  }

  // Now that all tick processing is done, units have moved, combat has occurred, stations have been destroyed etc,
  // we can refresh the hexes we need to update.
  hexUpdateTracker.refreshHexesToUpdate(planets, stations, units);

  // --- D. PERSISTENCE (Bulk Writes) ---
  // We collect all operations into arrays and execute them in batches.

  const userOps: AnyBulkWriteOperation<User>[] = [];
  const unitOps: AnyBulkWriteOperation<Unit>[] = [];
  const hexOps: AnyBulkWriteOperation<Hex>[] = [];
  const planetOps: AnyBulkWriteOperation<Planet>[] = [];
  const playerOps: AnyBulkWriteOperation<Player>[] = [];
  const unitsToDelete: ObjectId[] = [...tickResult.unitsToRemove];
  const stationsToDelete: ObjectId[] = [...tickResult.stationsToRemove];

  // Prepare Planet Updates (From Capture)
  tickResult.planetUpdates.forEach((update, planetId) => {
    planetOps.push({
      updateOne: {
        filter: { _id: new ObjectId(planetId) },
        update: { $set: update },
      },
    });
  });

  // Prepare Cycle Updates (If applicable)
  if (cycleResult) {
    // If there is a winner, increment the user's victories achievement.
    if (cycleResult.winnerPlayerId) {
      const winnerPlayer = players.find(
        (p) => String(p._id) === String(cycleResult.winnerPlayerId)
      )!;

      userOps.push({
        updateOne: {
          filter: { _id: winnerPlayer.userId },
          update: { $inc: { "achievements.victories": 1 } },
        },
      });

      // TODO: Calculate rank increments for all players.
      // TODO: AFK players should get negative rank equal to the number of players in the game.
    }

    // Player Updates (Prestige/VP)
    cycleResult.playerUpdates.forEach((update, id) => {
      playerOps.push({
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { $set: update },
        },
      });
    });

    // Dead Units from Starvation
    cycleResult.unitsToDelete.forEach((id) => unitsToDelete.push(id));
  }

  // Prepare Unit Updates
  // Remove dead entities from arrays so they aren't processed in DB update operations.
  units = units.filter(
    (u) => !tickResult.unitsToRemove.some((id) => String(id) === String(u._id))
  );

  // Note: Units are ALWAYS fully updated. We process unit movement, combat and supply every tick
  // so we might as well update everything.
  units.forEach((unit) => {
    unitOps.push({
      updateOne: {
        filter: { _id: unit._id },
        update: { $set: unit }, // Overwrite with new state
      },
    });
  });

  // Get only the hexes that are being tracked by the hex update tracker.
  const hexesToUpdate = Array.from(hexUpdateTracker.hexesToUpdate).map(
    (coord) => tickContext.hexLookup.get(coord)!
  );

  // Note: Hexes are ALWAYS fully updated.
  hexesToUpdate.forEach((hex) => {
    hexOps.push({
      updateOne: {
        filter: { _id: hex._id },
        update: { $set: hex }, // Overwrite with new state
      },
    });
  });

  // Update Game State
  // Logic: Base Tick Update -> Merge Tick Result (Elimination) -> Merge Cycle Result (Economy/Cycle count)
  let nextGameState: any = {
    ...game.state,
    status: GameStates.ACTIVE, // Unlocks the game
    tick: newTick,
    lastTickDate: new Date(),
  };

  // 1. Merge Tick updates (e.g. Elimination Victory)
  if (tickResult.gameStateUpdates && tickResult.gameStateUpdates) {
    nextGameState = {
      ...nextGameState,
      ...tickResult.gameStateUpdates,
    };
  }

  // 2. Merge Cycle updates (e.g. Cycle++ or VP Victory)
  // Cycle updates generally take precedence as they happen "after" the tick logic
  if (cycleResult && cycleResult.gameStateUpdates) {
    nextGameState = {
      ...nextGameState,
      ...cycleResult.gameStateUpdates,
    };
  }

  // IF Game Completed, log it
  if (nextGameState.status === GameStates.COMPLETED) {
    console.log(
      `🏆 Game ${gameId} Completed! Winner: ${nextGameState.winnerPlayerId}`
    );
  }

  // 5. EXECUTE DB OPERATIONS
  await executeInTransaction(async (db, session) => {
    await db
      .collection<Game>("games")
      .updateOne({ _id: gameId }, { $set: { state: nextGameState } });

    // Execute Bulk Ops
    const promises: Promise<BulkWriteResult | DeleteResult>[] = [];

    if (userOps.length > 0)
      promises.push(db.collection<User>("users").bulkWrite(userOps));

    if (unitOps.length > 0)
      promises.push(db.collection<Unit>("units").bulkWrite(unitOps));

    if (hexOps.length > 0)
      promises.push(db.collection<Hex>("hexes").bulkWrite(hexOps));

    if (planetOps.length > 0)
      promises.push(db.collection<Planet>("planets").bulkWrite(planetOps));

    if (playerOps.length > 0)
      promises.push(db.collection<Player>("players").bulkWrite(playerOps));

    if (unitsToDelete.length > 0)
      promises.push(
        db.collection<Unit>("units").deleteMany({ _id: { $in: unitsToDelete } })
      );

    if (stationsToDelete.length > 0)
      promises.push(
        db
          .collection<Station>("stations")
          .deleteMany({ _id: { $in: stationsToDelete } })
      );

    await Promise.all(promises);

    // Save Combat Reports
    if (tickResult.combatReports.length > 0) {
      // Insert one for the attacker and another for the defender.
      await db.collection<GameEvent>("game_events").insertMany(
        tickResult.combatReports.map((r) => ({
          _id: new ObjectId(),
          gameId: gameId,
          playerId: r.attackerId,
          tick: newTick,
          type: "COMBAT_REPORT",
          data: r,
          createdAt: new Date(),
        }))
      );

      await db.collection<GameEvent>("game_events").insertMany(
        tickResult.combatReports.map((r) => ({
          _id: new ObjectId(),
          gameId: gameId,
          playerId: r.defenderId,
          tick: newTick,
          type: "COMBAT_REPORT",
          data: r,
          createdAt: new Date(),
        }))
      );
    }
  });

  console.log(`✅ Tick Complete.`);
}
