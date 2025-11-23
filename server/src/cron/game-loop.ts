import cron from 'node-cron';
import { MongoClient, ObjectId, AnyBulkWriteOperation, BulkWriteResult, DeleteResult } from 'mongodb';
import { 
  Game, GameStates, 
  GameMap, 
  Unit, Player, Hex, Planet,
  TickProcessor, 
  GameManager,
  HexUtils, 
  ProcessCycleResult,
  Station
} from '@solaris-command/core';

// Concurrency Flag: Prevent loop overlapping if processing takes > tick duration
let isProcessing = false;

export const GameLoop = {
  start(mongoClient: MongoClient) {
    // Default: Run every 10 seconds to check for ticks
    const schedule = process.env.GAME_LOOP_SCHEDULE || '*/10 * * * * *';
    
    console.log(`⏰ Game Loop scheduled: [${schedule}]`);

    cron.schedule(schedule, async () => {
      if (isProcessing) {
        console.warn('⚠️  Skipping loop: Previous tick still processing.');
        return;
      }
      
      isProcessing = true;
      try {
        await processActiveGames(mongoClient);
      } catch (err) {
        console.error('🔥 Critical Error in Game Loop:', err);
      } finally {
        isProcessing = false;
      }
    });
  }
};

/**
 * Main Processor: Iterates through all running games
 */
async function processActiveGames(client: MongoClient) {
  const db = client.db();
  
  // 1. Find games that are ACTIVE
  const activeGames = await db.collection<Game>('games').find({ 
    'state.status': GameStates.ACTIVE 
  }).toArray();

  for (const game of activeGames) {
    try {
      // 2. Time Check: Is it time for a tick?
      // Logic: Start Date + (Tick Count * Tick Duration)
      // This prevents clock drift compared to just adding to 'lastTickDate'
      const nextTickTime = new Date(game.state.startDate!).getTime() + ((game.state.tick + 1) * game.settings.tickDurationMS);
      const now = Date.now();

      if (now >= nextTickTime) {
        console.log(`⚡ Processing Tick ${game.state.tick + 1} for Game ${game._id}`);
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

  // --- A. LOAD STATE (Scatter-Gather) ---
  // We need to load data from multiple collections to build the game state
  
  const [mapDoc, hexes, units, players, planets, stations] = await Promise.all([
    db.collection<GameMap>('maps').findOne({ _id: game.mapId }),
    db.collection<Hex>('hexes').find({ gameId: gameId }).toArray(),
    db.collection<Unit>('units').find({ gameId: gameId }).toArray(),
    db.collection<Player>('players').find({ gameId: gameId }).toArray(),
    db.collection<Planet>('planets').find({ gameId: gameId }).toArray(),
    db.collection<Station>('stations').find({ gameId: gameId }).toArray()
  ]);

  if (!mapDoc) throw new Error('Map metadata not found');

  // --- B. RUN TICK PROCESSOR (Physics/Combat) ---
  // This calculates moves, battles, and captures based on the loaded state
  const tickResult = TickProcessor.processTick(game, hexes, units, planets, stations);

  // --- C. CHECK FOR CYCLE (Economy) ---
  // If this new tick completes a cycle (e.g., tick 24, 48...)
  const newTick = game.state.tick + 1;
  const isCycleComplete = newTick % game.settings.ticksPerCycle === 0;
  
  let cycleResult: ProcessCycleResult | null = null;

  if (isCycleComplete) {
    console.log(`💰 Processing Cycle ${game.state.cycle + 1} for Game ${gameId}`);
    
    // IMPORTANT: Apply the Tick updates to our memory objects BEFORE running Cycle logic
    // so supply calculations use the new positions/ownerships and delete units/stations that are
    // no longer present in the game.
    
    tickResult.unitsToRemove.forEach(id => units.splice(units.findIndex(u => u._id === id), 1));
    tickResult.stationsToRemove.forEach(id => stations.splice(stations.findIndex(s => s._id === id), 1));

    const updatedUnits = units.map(u => {
      const update = tickResult.unitUpdates.get(u._id.toString());
      return update ? { ...u, ...update } : u; // Merge tick updates
    }) as Unit[];

    const updatedPlanets = planets.map(p => {
      const update = tickResult.planetUpdates.get(p._id.toString());
      return update ? { ...p, ...update } : p; // Merge tick updates
    }) as Planet[];

    // Run the Economy/Logistics Logic
    cycleResult = GameManager.processCycle(game, players, updatedUnits, updatedPlanets, stations);
  }

  // --- D. PERSISTENCE (Bulk Writes) ---
  // We collect all operations into arrays and execute them in batches.
  
  const unitOps: AnyBulkWriteOperation<Unit>[] = [];
  const hexOps: AnyBulkWriteOperation<Hex>[] = [];
  const planetOps: AnyBulkWriteOperation<Planet>[] = [];
  const playerOps: AnyBulkWriteOperation<Player>[] = [];
  const unitsToDelete: ObjectId[] = [...tickResult.unitsToRemove];
  const stationsToDelete: ObjectId[] = [...tickResult.stationsToRemove];

  // 1. Prepare Unit Updates (From Tick)
  tickResult.unitUpdates.forEach((unit, id) => {
    unitOps.push({
      updateOne: {
        filter: { _id: new ObjectId(id) },
        update: { $set: unit } // Overwrite with new state
      }
    });
  });

  // 2. Prepare Hex Updates (From Tick)
  tickResult.hexUpdates.forEach((update, hexIdStr) => {
    const coords = HexUtils.parseID(hexIdStr);
    hexOps.push({
      updateOne: {
        filter: { gameId: gameId, 'coords.q': coords.q, 'coords.r': coords.r, 'coords.s': coords.s },
        update: { $set: update }
      }
    });
  });

  // 3. Prepare Planet Updates (From Capture)
  tickResult.planetUpdates.forEach((update, planetId) => {
    planetOps.push({
      updateOne: {
        filter: { _id: new ObjectId(planetId) },
        update: { $set: update }
      }
    });
  });

  // 4. Prepare Cycle Updates (If applicable)
  if (cycleResult) {
    // Unit Updates (Refill AP/MP)
    cycleResult.unitUpdates.forEach((partialUnit, id) => {
        // Note: If unit was updated in Tick AND Cycle, this pushes a second op.
        // Mongo executes sequentially, so the Cycle update (refill) applies last.
        unitOps.push({
            updateOne: {
                filter: { _id: new ObjectId(id) },
                update: { $set: partialUnit }
            }
        });
    });

    // Player Updates (Prestige/VP)
    cycleResult.playerUpdates.forEach((update, id) => {
      playerOps.push({
        updateOne: {
            filter: { _id: new ObjectId(id) },
            update: { $set: update }
        }
      });
    });

    // Dead Units from Starvation
    cycleResult.unitsToRemove.forEach(id => unitsToDelete.push(id));
  }

  // 5. EXECUTE DB OPERATIONS
  
  // Save Combat Reports
  if (tickResult.combatReports.length > 0) {
    await db.collection('game_events').insertMany(tickResult.combatReports.map(r => ({
      ...r,
      gameId: gameId,
      type: 'COMBAT_REPORT',
      createdAt: new Date()
    })));
  }

  // Update Game State (Tick count, Last Tick Date)
  const gameStateUpdate = cycleResult ? cycleResult.gameUpdates : {
    state: { 
      ...game.state, 
      tick: newTick,
      lastTickDate: new Date()
    }
  };
  
  await db.collection<Game>('games').updateOne(
    { _id: gameId }, 
    { $set: gameStateUpdate } as any
  );

  // Execute Bulk Ops
  const promises: Promise<BulkWriteResult | DeleteResult>[] = [];
  
  if (unitOps.length > 0) promises.push(db.collection<Unit>('units').bulkWrite(unitOps));
  if (hexOps.length > 0) promises.push(db.collection<Hex>('hexes').bulkWrite(hexOps));
  if (planetOps.length > 0) promises.push(db.collection<Planet>('planets').bulkWrite(planetOps));
  if (playerOps.length > 0) promises.push(db.collection<Player>('players').bulkWrite(playerOps));
  if (unitsToDelete.length > 0) promises.push(db.collection<Unit>('units').deleteMany({ _id: { $in: unitsToDelete } }));
  if (stationsToDelete.length > 0) promises.push(db.collection<Station>('stations').deleteMany({ _id: { $in: stationsToDelete } }));

  await Promise.all(promises);
  
  console.log(`✅ Tick Complete. UnitOps: ${unitOps.length}, HexOps: ${hexOps.length}, PlanetOps: ${planetOps.length}`);
}