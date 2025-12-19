import { ObjectId } from "mongodb";
import { HexCoords } from "../types/geometry";
import { SupplySource } from "../types/supply";

export interface Station {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: ObjectId;

  hexId: ObjectId;
  location: HexCoords;
  
  supply: SupplySource;
}
