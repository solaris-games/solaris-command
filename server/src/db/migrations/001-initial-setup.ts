import { Db, MongoClient } from "mongodb";
import { GameModel } from "../schemas/game";
import { HexModel } from "../schemas/hex";
import { UnitModel } from "../schemas/unit";
import { PlayerModel } from "../schemas/player";
import { PlanetModel } from "../schemas/planet";
import { StationModel } from "../schemas/station";
import { GameEventModel } from "../schemas/game-event";
import { UserModel } from "../schemas/user";

export async function up(db: Db, client: MongoClient) {
  console.log("🛠️  Initializing Mongoose Indexes...");

  try {
      await GameModel.syncIndexes();
      await HexModel.syncIndexes();
      await UnitModel.syncIndexes();
      await PlayerModel.syncIndexes();
      await PlanetModel.syncIndexes();
      await StationModel.syncIndexes();
      await GameEventModel.syncIndexes();
      await UserModel.syncIndexes();

      console.log("✅ Indexes synchronized.");
  } catch (err: any) {
    console.error("🔥 Database setup failed:", err);
    throw err;
  }
}
