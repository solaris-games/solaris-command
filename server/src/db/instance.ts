import mongoose, { Connection, ClientSession } from "mongoose";
import * as dotenv from "dotenv";
import {
  GameEventModel,
  GameModel,
  HexModel,
  PlanetModel,
  PlayerModel,
  StationModel,
  UnitModel,
  UserModel,
  ConversationModel,
  MessageModel,
} from "./schemas";

dotenv.config();

const mongoUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/solaris-command";

let connection: Connection | null = null;

export const connectToDb = async (): Promise<Connection> => {
  if (connection) return connection;

  try {
    const mongooseInstance = await mongoose.connect(mongoUri);
    connection = mongooseInstance.connection;
    console.log(`✅ Connected to MongoDB via Mongoose: ${connection.name}`);

    await GameModel.syncIndexes();
    await HexModel.syncIndexes();
    await UnitModel.syncIndexes();
    await PlayerModel.syncIndexes();
    await PlanetModel.syncIndexes();
    await StationModel.syncIndexes();
    await GameEventModel.syncIndexes();
    await UserModel.syncIndexes();
    await ConversationModel.syncIndexes();
    await MessageModel.syncIndexes();

    console.log("✅ Indexes synchronized.");

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

/**
 * Uses MongoDB transactions to safely save changes to the database.
 * Note: Calls to this function MUST BE idempotent. They might be executed multiple times.
 */
// export const executeInTransaction = async <T>(
//   callback: (session: ClientSession) => Promise<T>
// ): Promise<T> => {
//   const session = await mongoose.startSession();

//   try {
//     return await session.withTransaction(callback);
//   } finally {
//     await session.endSession();
//   }
// };

export const executeInTransaction = async (
  callback: (session: ClientSession) => Promise<any>,
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
