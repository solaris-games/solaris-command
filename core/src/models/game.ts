import { UnifiedId } from "../types";

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
  winnerPlayerId: UnifiedId | null;
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
  _id: UnifiedId;
  mapId: string; // Name of the map used to generate the game's galaxy.

  name: string;
  description: string;

  state: GameState;
  settings: GameSettings;
}
