import { ObjectId } from "mongodb";
import { HexCoords } from "../types/geometry";
import { SupplySource } from "../types/supply";

export interface Station {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: ObjectId;

  location: HexCoords; // TODO: This should be a hex ID or we add hexId to this model?
  supply: SupplySource;
}
