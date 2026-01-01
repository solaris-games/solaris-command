import { Schema, model } from "mongoose";
import {
  Game,
  GameState,
  GameSettings,
  GameStates,
} from "@solaris-command/core";

const GameStateSchema = new Schema<GameState>(
  {
    status: {
      type: String,
      enum: Object.values(GameStates),
      required: true,
      default: GameStates.PENDING,
    },
    playerCount: { type: Number, required: true, default: 0 },
    tick: { type: Number, required: true, default: 0 },
    cycle: { type: Number, required: true, default: 0 },
    createdDate: { type: Date, required: true, default: Date.now },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    lastTickDate: { type: Date, default: null },
    winnerPlayerId: { type: Schema.ObjectId, default: null },
  },
  { _id: false }
);

const GameSettingsSchema = new Schema<GameSettings>(
  {
    playerCount: { type: Number, required: true },
    ticksPerCycle: { type: Number, required: true },
    tickDurationMS: { type: Number, required: true },
    victoryPointsToWin: { type: Number, required: true },
    combatVersion: { type: String, required: true, default: "v1" },
    movementVersion: { type: String, required: true, default: "v1" },
  },
  { _id: false }
);

const GameSchema = new Schema<Game>({
  mapId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  state: { type: GameStateSchema, required: true },
  settings: { type: GameSettingsSchema, required: true },
});

// Indexes
GameSchema.index({ "state.status": 1, "settings.playerCount": 1 });

export const GameModel = model<Game>("Game", GameSchema);
