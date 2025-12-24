import { Schema, model } from "mongoose";
import { Unit, UnitStatus } from "@solaris-command/core";

const HexCoordsSchema = new Schema(
  {
    q: { type: Number, required: true },
    r: { type: Number, required: true },
    s: { type: Number, required: true },
  },
  { _id: false }
);

const UnitStepSchema = new Schema(
  {
    isSuppressed: { type: Boolean, required: true, default: false },
    specialistId: { type: String, default: null },
  },
  { _id: false }
);

const UnitStateSchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(UnitStatus),
      required: true,
      default: UnitStatus.IDLE,
    },
    ap: { type: Number, required: true, default: 0 },
    mp: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const UnitMovementSchema = new Schema(
  {
    path: [HexCoordsSchema],
  },
  { _id: false }
);

const UnitCombatSchema = new Schema(
  {
    hexId: { type: Schema.ObjectId, default: null },
    location: { type: HexCoordsSchema, default: null },
    operation: { type: String, default: null },
    advanceOnVictory: { type: Boolean, default: null },
  },
  { _id: false }
);

const SupplyTargetSchema = new Schema(
  {
    isInSupply: { type: Boolean, required: true },
    ticksLastSupply: { type: Number, required: true, default: 0 },
    ticksOutOfSupply: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const UnitSchema = new Schema<Unit>({
  gameId: { type: Schema.ObjectId, ref: "Game", required: true },
  playerId: { type: Schema.ObjectId, ref: "Player", required: true },
  catalogId: { type: String, required: true },

  hexId: { type: Schema.ObjectId, ref: "Hex", required: true },
  location: { type: HexCoordsSchema, required: true },

  steps: { type: [UnitStepSchema], required: true },
  state: { type: UnitStateSchema, required: true },
  movement: { type: UnitMovementSchema, required: true },
  combat: { type: UnitCombatSchema, required: true },
  supply: { type: SupplyTargetSchema, required: true },
});

// Indexes
UnitSchema.index({ gameId: 1 });
UnitSchema.index({ playerId: 1 });
UnitSchema.index({ gameId: 1, playerId: 1 });
UnitSchema.index({ gameId: 1, "combat.hexId": 1 });

export const UnitModel = model<Unit>("Unit", UnitSchema);
