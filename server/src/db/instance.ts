import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/solaris';
const dbName = process.env.DB_NAME || 'solaris';

let db: Db | null = null;
let client: MongoClient | null = null;

export const connectToDb = async (): Promise<{
    db: Db,
    client: MongoClient
}> => {
  if (db && client) return {
    db,
    client
  };

  try {
    client = await MongoClient.connect(mongoUri);
    db = client.db(dbName);
    console.log(`✅ Connected to MongoDB: ${dbName}`);

    return {
        db,
        client
    };
  } catch (err) {
    console.error('❌ Could not connect to MongoDB', err);
    process.exit(1);
  }
};

export const getDb = (): Db => {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDb() first.');
  }
  
  return db;
};

export const closeDb = async () => {
  if (client) {
    await client.close();
    db = null;
    client = null;
  }
};