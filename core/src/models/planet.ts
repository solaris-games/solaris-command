import { ObjectId } from 'mongodb';
import { HexCoord } from '../types/geometry';
import { SupplySource } from '../types/supply';

export interface Planet {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: ObjectId | null;

  name: string;
  location: HexCoord;
  supply: SupplySource;

  isCapital: boolean;
  prestigePointsPerCycle: number; // How much prestige is awarded to the player per cycle
  victoryPointsPerCycle: number;
}