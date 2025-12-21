import { ClientSession } from "mongoose";
import { PlayerService } from "./PlayerService";
import { PlayerStatus, UnifiedId, User } from "@solaris-command/core";
import { UserModel } from "../db/schemas/user";
import { PlayerModel } from "../db/schemas/player";

export class UserService {
  static async createUser(user: User, session?: ClientSession) {
    const newUser = new UserModel(user);
    await newUser.save({ session });
    return newUser;
  }

  static async getUserById(userId: UnifiedId) {
    return UserModel.findById(userId);
  }

  static async getUserByEmail(email: string) {
    return UserModel.findOne({ email });
  }

  static async touchUser(userId: UnifiedId) {
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

  static async deleteUser(userId: UnifiedId, session?: ClientSession) {
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
    const pendingPlayers = await PlayerService.findPendingPlayersForUser(
      userId
    );

    if (pendingPlayers.length) {
      const playerIds = pendingPlayers.map((p) => p._id);

      // Bulk delete players
      await PlayerModel.deleteMany({ _id: { $in: playerIds } }, { session });

      // Iterate over each player and remove their game assets.
      for (const player of pendingPlayers) {
        await PlayerService.removePlayerAssets(
          player.gameId,
          player._id as UnifiedId,
          session
        );
      }
    }

    return result;
  }
}
