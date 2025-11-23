import { ObjectId } from 'mongodb';
import { HexCoord } from '../types/geometry';
import { SupplySource } from '../types/supply';

export enum StationStatuses {
  CONSTRUCTING = 'CONSTRUCTING',        // Does not provide supply yet
  ACTIVE = 'ACTIVE',                    // Provides supply
  DECOMMISSIONING = 'DECOMMISSIONING'   // Does not provide supply
}

export interface Station {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: ObjectId | null;

  status: StationStatuses
  location: HexCoord;
  supply: SupplySource;
}