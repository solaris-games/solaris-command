import { ClientSession, Db, ObjectId } from "mongodb";
import { Player, User } from "@solaris-command/core";
import { getDb } from "../db/instance";
import { PlayerService } from "./PlayerService";
import { PlayerStatus } from "@solaris-command/core";

export class UserService {
  static async getUserById(db: Db, userId: ObjectId) {
    return db.collection<User>("users").findOne({ _id: userId });
  }

  static async getUserByEmail(db: Db, email: string) {
    return db.collection<User>("users").findOne({ email });
  }

  static async touchUser(db: Db, userId: ObjectId) {
    // Update last seen
    return db.collection<User>("users").updateOne(
      { _id: userId },
      {
        $set: {
          lastSeenDate: new Date(),
        },
      }
    );
  }

  static async deleteUser(db: Db, userId: ObjectId, session?: ClientSession) {
    // 1. Delete the user
    const result = await db
      .collection<User>("users")
      .deleteOne({ _id: userId }, { session });

    if (result.deletedCount === 0) {
      return result; // Or throw error, but existing logic returned 404
    }

    // 2. Handle Active Games -> Set as DEFEATED
    const activePlayers = await PlayerService.findActivePlayersForUser(
      db,
      userId
    );
    if (activePlayers.length) {
      // We can do this in bulk or loop. Existing logic did bulk updateMany.
      // But we abstracted setStatus in PlayerService.
      // To mimic the exact efficiency of existing code, we might want a bulk method,
      // but loop with session is fine for now unless scale is huge.
      // Actually, existing code did:
      // updateMany({ _id: { $in: activePlayers.map((p) => p._id) } }, { $set: { status: PlayerStatus.DEFEATED } }, { session });

      const playerIds = activePlayers.map((p) => p._id);
      await db
        .collection<Player>("players")
        .updateMany(
          { _id: { $in: playerIds } },
          { $set: { status: PlayerStatus.DEFEATED } },
          { session }
        );
    }

    // 3. Handle Pending Games -> Delete Player & Assets
    const pendingPlayers = await PlayerService.findPendingPlayersForUser(
      db,
      userId
    );
    if (pendingPlayers.length) {
      const playerIds = pendingPlayers.map((p) => p._id);

      // Bulk delete players
      await db
        .collection<Player>("players")
        .deleteMany({ _id: { $in: playerIds } }, { session });

      // Bulk remove assets
      // Since UnitService etc take playerId, we might need a "bulkDeleteByPlayerIds" or loop.
      // The original code did: deleteMany({ playerId: { $in: pendingPlayers.map... } })

      // I'll call a loop here for simplicity and reuse of PlayerService logic,
      // OR I can add bulk methods to leaf services if performance is key.
      // Original code was efficient bulk ops. Let's try to maintain that if possible,
      // but PlayerService.removePlayerAssets takes one ID.

      // Let's iterate for now. It's cleaner.
      for (const player of pendingPlayers) {
        await PlayerService.removePlayerAssets(db, player._id, session);
      }
    }

    return result;
  }
}
