import { Schema, model } from "mongoose";
import { Player, PlayerStatus } from "@solaris-command/core";

const PlayerSchema = new Schema<Player>({
  gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  alias: { type: String, required: true },
  color: { type: String, required: true },
  status: {
    type: String,
    enum: Object.values(PlayerStatus),
    required: true,
    default: PlayerStatus.ACTIVE,
  },
  prestigePoints: { type: Number, required: true, default: 0 },
  victoryPoints: { type: Number, required: true, default: 0 },
  lastSeenDate: { type: Date, required: true, default: Date.now },
});

// Indexes
PlayerSchema.index({ gameId: 1 });
PlayerSchema.index({ gameId: 1, userId: 1 }, { unique: true });

export const PlayerModel = model<Player>("Player", PlayerSchema);
