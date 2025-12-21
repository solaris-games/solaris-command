import { Schema, model } from "mongoose";
import { Planet } from "@solaris-command/core";

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

const PlanetSchema = new Schema<Planet>({
  gameId: { type: Schema.ObjectId, ref: "Game", required: true },
  playerId: { type: Schema.ObjectId, ref: "Player", default: null },
  hexId: { type: Schema.ObjectId, ref: "Hex", required: true },
  location: { type: HexCoordsSchema, required: true },

  name: { type: String, required: true },
  isCapital: { type: Boolean, required: true, default: false },
  supply: { type: SupplySourceSchema, required: true },
});

// Indexes
PlanetSchema.index({ gameId: 1 });
PlanetSchema.index({ playerId: 1 });
PlanetSchema.index({ gameId: 1, playerId: 1 });

export const PlanetModel = model<Planet>("Planet", PlanetSchema);
