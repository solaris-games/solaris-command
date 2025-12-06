import { ObjectId } from "mongodb";
import { HexCoords } from "../types/geometry";
import { SupplySource } from "../types/supply";

export enum StationStatus {
  CONSTRUCTING = "CONSTRUCTING", // Does not provide supply yet
  ACTIVE = "ACTIVE", // Provides supply
  DECOMMISSIONING = "DECOMMISSIONING", // Does not provide supply
}

export interface Station {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: ObjectId;

  // TODO: Need a tickActive and tickDecommissioned so we can track when the status is due to change
  // and when the station is due to be decommissioned.

  status: StationStatus;
  location: HexCoords; // TODO: This should be a hex ID or we add hexId to this model?
  supply: SupplySource;
}
