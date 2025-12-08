import { MongoClient, Db, ClientSession } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/solaris";
const dbName = process.env.DB_NAME || "solaris";

let db: Db | null = null;
let client: MongoClient | null = null;

export const connectToDb = async (): Promise<{
  db: Db;
  client: MongoClient;
}> => {
  if (db && client)
    return {
      db,
      client,
    };

  try {
    client = await MongoClient.connect(mongoUri);
    db = client.db(dbName);
    console.log(`✅ Connected to MongoDB: ${dbName}`);

    return {
      db,
      client,
    };
  } catch (err) {
    console.error("❌ Could not connect to MongoDB", err);
    process.exit(1);
  }
};

export const getDb = (): Db => {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDb() first.");
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

export const executeInTransaction = async (
  callback: (db: Db, session: ClientSession) => Promise<any>
) => {
  const db = getDb();
  const session = db.client.startSession();

  try {
    session.startTransaction();

    const result = await callback(db, session);

    await session.commitTransaction();
    return result; // Return the result of the callback
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    await session.endSession();
  }
};
