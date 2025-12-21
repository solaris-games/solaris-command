import { Schema, model } from "mongoose";
import { Station } from "@solaris-command/core";

const HexCoordsSchema = new Schema(
  {
    q: { type: Number, required: true },
    r: { type: Number, required: true },
    s: { type: Number, required: true },
  },
  { _id: false }
);

const SupplySourceSchema = new Schema(
  {
    isInSupply: { type: Boolean, required: true },
    isRoot: { type: Boolean, required: true },
  },
  { _id: false }
);

const StationSchema = new Schema<Station>({
  gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
  playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
  hexId: { type: Schema.Types.ObjectId, ref: "Hex", required: true },
  location: { type: HexCoordsSchema, required: true },
  supply: { type: SupplySourceSchema, required: true },
});

// Indexes
StationSchema.index({ gameId: 1 });
StationSchema.index({ playerId: 1 });
StationSchema.index({ gameId: 1, playerId: 1 });

export const StationModel = model<Station>("Station", StationSchema);
