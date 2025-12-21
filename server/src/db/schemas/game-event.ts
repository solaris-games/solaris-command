import { Schema, model } from "mongoose";
import { GameEvent } from "@solaris-command/core";

const GameEventSchema = new Schema<GameEvent>({
  gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
  playerId: { type: Schema.Types.ObjectId, ref: "Player", default: null },
  tick: { type: Number, required: true },
  type: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } }); // Adds createdAt

// Indexes
// TTL Index: Automatically delete reports older than 14 days to save space
GameEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1209600 });
GameEventSchema.index({ gameId: 1, tick: -1 });

export const GameEventModel = model<GameEvent>("GameEvent", GameEventSchema);
