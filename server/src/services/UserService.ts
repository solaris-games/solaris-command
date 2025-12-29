import { ClientSession, Types } from "mongoose";
import { PlayerService } from "./PlayerService";
import {
  PlayerStatus,
  UnifiedId,
  User,
  UserFactory,
} from "@solaris-command/core";
import { UserModel } from "../db/schemas/user";
import { PlayerModel } from "../db/schemas/player";
import { GameService } from "./GameService";

export class UserService {
  static async createUser(user: User, session?: ClientSession) {
    const newUser = new UserModel(user);
    await newUser.save({ session });
    return newUser;
  }

  static async findOrCreateUser(
    email: string,
    googleId: string,
    username: string,
    session?: ClientSession
  ): Promise<User> {
    let user = await this.getUserByEmail(email);

    if (user) {
      await this.touchUser(user._id);
      return user;
    }

    const newUser: User = UserFactory.create(
      googleId,
      email,
      username,
      () => new Types.ObjectId()
    );

    const createdUser = await this.createUser(newUser, session);
    return createdUser;
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

        await GameService.deductPlayerCount(player.gameId, session);
      }
    }

    return result;
  }

  static async incrementUserVictories(
    userId: UnifiedId,
    amount: number,
    session?: ClientSession
  ) {
    await UserModel.updateOne(
      { _id: userId },
      { $inc: { "achievements.victories": amount } },
      { session }
    );
  }

  static async incrementUserRank(
    userId: UnifiedId,
    amount: number,
    session?: ClientSession
  ) {
    await UserModel.updateOne(
      { _id: userId },
      { $inc: { "achievements.rank": amount } },
      { session }
    );
  }

  static async incrementUserRenown(
    userId: UnifiedId,
    amount: number,
    session?: ClientSession
  ) {
    await UserModel.updateOne(
      { _id: userId },
      { $inc: { "achievements.renown": amount } },
      { session }
    );
  }
}
