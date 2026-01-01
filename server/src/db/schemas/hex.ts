import { Schema, model } from "mongoose";
import { Hex, TerrainTypes } from "@solaris-command/core";

const HexCoordsSchema = new Schema(
  {
    q: { type: Number, required: true },
    r: { type: Number, required: true },
    s: { type: Number, required: true },
  },
  { _id: false }
);

const HexSchema = new Schema<Hex>({
  gameId: { type: Schema.ObjectId, ref: "Game", required: true },
  playerId: { type: Schema.ObjectId, ref: "Player", default: null },
  planetId: { type: Schema.ObjectId, ref: "Planet", default: null },
  stationId: { type: Schema.ObjectId, ref: "Station", default: null },
  unitId: { type: Schema.ObjectId, ref: "Unit", default: null },

  location: { type: HexCoordsSchema, required: true },
  terrain: {
    type: String,
    enum: Object.values(TerrainTypes),
    required: true,
    default: TerrainTypes.EMPTY,
  },

  zoc: [
    {
      playerId: { type: Schema.ObjectId, required: true },
      unitId: { type: Schema.ObjectId, required: true },
      _id: false,
    },
  ],
});

// Indexes
HexSchema.index(
  { gameId: 1, "location.q": 1, "location.r": 1, "location.s": 1, terrain: 1 },
  { unique: true }
);
HexSchema.index({ gameId: 1 });
HexSchema.index({ gameId: 1, playerId: 1 });

export const HexModel = model<Hex>("Hex", HexSchema);
