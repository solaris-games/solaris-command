import { ObjectId } from 'mongodb';
import { HexCoords } from '../types/geometry';
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

  // TODO: Need a tickActive and tickDecommissioned so we can track when the status is due to change
  // and when the station is due to be decommissioned.

  status: StationStatuses
  location: HexCoords;
  supply: SupplySource;
}