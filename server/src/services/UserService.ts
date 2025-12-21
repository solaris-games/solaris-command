import { ClientSession, Types } from "mongoose";
import { PlayerService } from "./PlayerService";
import { PlayerStatus } from "@solaris-command/core";
import { UserModel } from "../db/schemas/user";
import { PlayerModel } from "../db/schemas/player";

export class UserService {
  static async getUserById(userId: Types.ObjectId) {
    return UserModel.findById(userId);
  }

  static async getUserByEmail(email: string) {
    return UserModel.findOne({ email });
  }

  static async touchUser(userId: Types.ObjectId) {
    // Update last seen
    return UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          lastSeenDate: new Date(),
        },
      }
    );
  }

  static async deleteUser(userId: Types.ObjectId, session?: ClientSession) {
    // 1. Delete the user
    const result = await UserModel.deleteOne({ _id: userId }, { session });

    if (result.deletedCount === 0) {
      return result; // Or throw error, but existing logic returned 404
    }

    // 2. Handle Active Games -> Set as DEFEATED
    const activePlayers = await PlayerService.findActivePlayersForUser(userId);
    if (activePlayers.length) {
      const playerIds = activePlayers.map((p) => p._id);
      await PlayerModel.updateMany(
        { _id: { $in: playerIds } },
        { $set: { status: PlayerStatus.DEFEATED } },
        { session }
      );
    }

    // 3. Handle Pending Games -> Delete Player & Assets
    const pendingPlayers = await PlayerService.findPendingPlayersForUser(userId);

    if (pendingPlayers.length) {
      const playerIds = pendingPlayers.map((p) => p._id);

      // Bulk delete players
      await PlayerModel.deleteMany({ _id: { $in: playerIds } }, { session });

      // Iterate over each player and remove their game assets.
      for (const player of pendingPlayers) {
        await PlayerService.removePlayerAssets(
          player.gameId as unknown as Types.ObjectId,
          player._id as unknown as Types.ObjectId,
          session
        );
      }
    }

    return result;
  }
}
