import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/solaris-command';

export async function initDb() {
  console.log('🛠️  Initializing Database...');
  
  const client = await MongoClient.connect(mongoUri);
  const db = client.db();

  try {
    // --- 1. GAMES COLLECTION ---
    await db.createCollection('games', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['state', 'settings', 'mapId'],
          properties: {
            state: {
              bsonType: 'object',
              required: ['status', 'tick', 'cycle'],
              properties: {
                status: { enum: ['PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED'] },
                tick: { bsonType: 'int' },
                cycle: { bsonType: 'int' }
              }
            }
          }
        }
      }
    });

    // Index: Find Active games quickly for the Cron Loop
    await db.collection('games').createIndex({ "state.status": 1 });
    console.log('✅ Collection `games` setup.');

    // --- 2. HEXES COLLECTION (The Big One) ---
    await db.createCollection('hexes', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['gameId', 'coords', 'terrain'],
          properties: {
            gameId: { bsonType: 'objectId' },
            coords: {
              bsonType: 'object',
              required: ['q', 'r', 's'],
              properties: {
                q: { bsonType: 'int' },
                r: { bsonType: 'int' },
                s: { bsonType: 'int' }
              }
            }
          }
        }
      }
    });
    
    // Index: The Coordinate System
    // Ensures we can find "Hex at 10,-10,0 in Game X" instantly.
    // Also ensures unique coordinates (can't have two hexes at same spot in same game).
    await db.collection('hexes').createIndex(
      { gameId: 1, "coords.q": 1, "coords.r": 1, "coords.s": 1 },
      { unique: true }
    );

    // Index: Region queries (find all hexes for a specific map)
    await db.collection('hexes').createIndex({ gameId: 1 });
    console.log('✅ Collection `hexes` setup.');

    // --- 3. UNITS COLLECTION ---
    await db.createCollection('units', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['gameId', 'playerId', 'location', 'stats'],
          properties: {
            status: { enum: ['IDLE', 'MOVING', 'PREPARING', 'REGROUPING'] }
          }
        }
      }
    });

    // Index: Find all units for a player
    await db.collection('units').createIndex({ gameId: 1, playerId: 1 });
    // Index: Collision Detection (Find units at specific location)
    await db.collection('units').createIndex({ gameId: 1, "location.q": 1, "location.r": 1, "location.s": 1 });
    console.log('✅ Collection `units` setup.');

    // --- 4. PLAYERS COLLECTION ---
    await db.createCollection('players');
    await db.collection('players').createIndex({ gameId: 1, userId: 1 }, { unique: true });
    console.log('✅ Collection `players` setup.');

    // --- 5. MAPS COLLECTION ---
    await db.createCollection('maps');
    console.log('✅ Collection `maps` setup.');

    // --- 6. PLANETS COLLECTION ---
    await db.createCollection('planets');
    await db.collection('planets').createIndex({ gameId: 1, playerId: 1 });
    console.log('✅ Collection `planets` setup.');

    // --- 7. STATIONS COLLECTION ---
    await db.createCollection('stations');
    await db.collection('stations').createIndex({ gameId: 1, playerId: 1 });
    console.log('✅ Collection `stations` setup.');

    // --- 8. GAME EVENTS (Combat Reports) ---
    await db.createCollection('game_events');
    // TTL Index: Automatically delete reports older than 14 days to save space
    await db.collection('game_events').createIndex({ "createdAt": 1 }, { expireAfterSeconds: 1209600 });
    console.log('✅ Collection `game_events` setup.');

  } catch (err: any) {
    if (err.code === 48) {
      console.log('⚠️  Collections already exist. Skipping creation.');
    } else {
      console.error('🔥 Database setup failed:', err);
    }
  } finally {
    await client.close();
  }
}

// If running directly from CLI: npx tsx src/db/setup.ts
if (require.main === module) {
  initDb();
}