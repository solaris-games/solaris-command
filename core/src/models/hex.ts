import { ObjectId } from 'mongodb';
import { HexCoord } from '../types/geometry';
import { TerrainType } from '../types/hex';
import { SupplyTarget } from '../types/supply';

export interface Hex {
  _id: ObjectId;
  gameId: ObjectId;
  unitId: ObjectId | null;  // One unit per hex.
  
  coords: HexCoord; // { q, r, s }
  terrain: TerrainType;
  supply: SupplyTarget;
  isImpassable: boolean; // Blocks movement completely
}