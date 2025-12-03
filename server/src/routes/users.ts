import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { getDb } from "../db/instance";
import {
  Game,
  GameStates,
  Hex,
  Planet,
  Player,
  PlayerStatus,
  Station,
  Unit,
  User,
} from "@solaris-command/core";

const router = express.Router();

// GET /api/v1/users/me
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const user = await db
      .collection<User>("users")
      .findOne({ _id: new ObjectId(req.user.id) });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // TODO: Need a mapping layer
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/v1/users/me
router.delete("/me", authenticateToken, async (req, res) => {
  // TODO: Use sessions everywhere we have multiple upsert/delete queries and migrate DB logic into a controller layer.
  const db = getDb();
  const session = db.client.startSession();

  try {
    session.startTransaction();

    const result = await db
      .collection<User>("users")
      .deleteOne({ _id: new ObjectId(req.user.id) }, { session });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Mark any games that the player is in player as defeated
    const activeGames = await db
      .collection<Game>("games")
      .find({ status: GameStates.ACTIVE })
      .toArray();

    const activePlayers = await db
      .collection<Player>("players")
      .find({
        gameId: { $in: activeGames.map((g) => g._id) },
        userId: new ObjectId(req.user.id),
        status: PlayerStatus.ACTIVE,
      })
      .toArray();

    if (activePlayers.length) {
      await db
        .collection<Player>("players")
        .updateMany(
          { _id: { $in: activePlayers.map((p) => p._id) } },
          { $set: { status: PlayerStatus.DEFEATED } },
          { session }
        );
    }

    // Remove the player from any games that are pending.
    const pendingGames = await db
      .collection<Game>("games")
      .find({ status: GameStates.PENDING })
      .toArray();

    const pendingPlayers = await db
      .collection<Player>("players")
      .find({
        gameId: { $in: pendingGames.map((g) => g._id) },
        userId: new ObjectId(req.user.id),
        status: PlayerStatus.ACTIVE,
      })
      .toArray();

    if (pendingPlayers.length) {
      await db
        .collection<Player>("players")
        .deleteMany(
          { _id: { $in: pendingPlayers.map((p) => p._id) } },
          { session }
        );

      // Also delete their units.
      await db.collection<Unit>("units").deleteMany(
        {
          playerId: { $in: pendingPlayers.map((p) => p._id) },
        },
        { session }
      );

      // And stations
      await db.collection<Station>("stations").deleteMany(
        {
          playerId: { $in: pendingPlayers.map((p) => p._id) },
        },
        { session }
      );

      // Remove planet ownerships
      await db.collection<Planet>("planets").updateMany(
        {
          playerId: { $in: pendingPlayers.map((p) => p._id) },
        },
        {
          $set: {
            playerId: null,
          },
        },
        { session }
      );

      // Remove hex ownerships
      await db.collection<Hex>("hexes").updateMany(
        {
          playerId: { $in: pendingPlayers.map((p) => p._id) },
        },
        {
          $set: {
            playerId: null,
          },
        },
        { session }
      );
    }

    await session.commitTransaction();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    await session.abortTransaction();

    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await session.endSession();
  }
});

export default router;
