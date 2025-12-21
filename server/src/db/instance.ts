import mongoose, { Connection, ClientSession } from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/solaris";

let connection: Connection | null = null;

export const connectToDb = async (): Promise<Connection> => {
  if (connection) return connection;

  try {
    const mongooseInstance = await mongoose.connect(mongoUri);
    connection = mongooseInstance.connection;
    console.log(`✅ Connected to MongoDB via Mongoose: ${connection.name}`);

    return connection;
  } catch (err) {
    console.error("❌ Could not connect to MongoDB", err);
    process.exit(1);
  }
};

export const getDb = (): Connection => {
  if (!connection) {
    throw new Error("Database not initialized. Call connectToDb() first.");
  }

  return connection;
};

export const closeDb = async () => {
  if (connection) {
    await connection.close();
    connection = null;
  }
};

export const executeInTransaction = async (
  callback: (session: ClientSession) => Promise<any>
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await callback(session);

    await session.commitTransaction();
    return result;
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    await session.endSession();
  }
};
