import { Request, Response, NextFunction } from "express";
import { getDb } from "../db/instance";
import { ObjectId } from "mongodb";
import { Player } from "@solaris-command/core";

// Extend Express to include game
declare global {
  namespace Express {
    interface Request {
      player: Player;
    }
  }
}

export const loadPlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user.id;
  const gameId = req.params.id;

  try {
    const db = getDb();

    const player = await db.collection<Player>("players").findOne({
      gameId: new ObjectId(gameId),
      userId: new ObjectId(userId),
    });

    if (!player) throw new Error("Player not found in this game");

    req.player = player;

    next();
  } catch (error) {
    console.error("Middleware Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const touchPlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Update the last seen date of the player
  if (req.player) {
    try {
      const db = getDb();
      
      await db.collection("players").updateOne(
        { _id: req.player._id },
        {
          $set: {
            lastSeenDate: new Date(),
          },
        }
      );
    } catch (error) {
      console.error("Middleware Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  next();
};
