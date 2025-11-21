import { ObjectId } from 'mongodb';

export enum GameStates {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED'
}

export interface GameState {
  status: GameStates;
  tick: number
  cycle: number
  createdDate: Date
  startDate: Date | null
  endDate: Date | null
  lastTickDate: Date | null
  winnerPlayerId: ObjectId | null
}

export interface GameSettings {
  playerCount: number;
  ticksPerCycle: number;
  tickDurationMS: number;
  victoryPointsToWin: number;
  combatVersion: 'v1';
  movementVersion: 'v1';
}

export interface Game {
  _id: ObjectId;
  mapId: ObjectId;
  playerIds: ObjectId[];

  name: string;
  description: string;
  
  state: GameState;
  settings: GameSettings;
}