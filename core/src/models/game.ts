import { ObjectId } from "mongodb";

export enum GameStates {
  PENDING = "PENDING",
  STARTING = "STARTING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  LOCKED = "LOCKED" // Locked by the system during tick processing
}

export interface GameState {
  status: GameStates;
  playerCount: number;
  tick: number;
  cycle: number;
  createdDate: Date;
  startDate: Date | null;
  endDate: Date | null;
  lastTickDate: Date | null;
  winnerPlayerId: ObjectId | null;
}

export interface GameSettings {
  playerCount: number;
  ticksPerCycle: number;
  tickDurationMS: number;
  victoryPointsToWin: number;
  combatVersion: "v1";
  movementVersion: "v1";
}

export interface Game {
  _id: ObjectId;

  name: string;
  description: string;

  state: GameState;
  settings: GameSettings;
}
