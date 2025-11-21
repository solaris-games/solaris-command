import { ObjectId } from 'mongodb';
import { HexCoords } from '../types/geometry';
import { TerrainTypes } from '../types/terrain';
import { SupplyTarget } from '../types/supply';

export interface Hex {
  _id: ObjectId;
  gameId: ObjectId;
  unitId: ObjectId | null;  // One unit per hex.
  
  coords: HexCoords; // { q, r, s }
  terrain: TerrainTypes;
  supply: SupplyTarget;
  isImpassable: boolean; // Blocks movement completely
}