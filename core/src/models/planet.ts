import { ObjectId } from "mongodb";
import { HexCoords } from "../types/geometry";
import { SupplySource } from "../types/supply";

export interface Planet {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: ObjectId | null;

  hexId: ObjectId;
  location: HexCoords;

  name: string;
  isCapital: boolean;
  supply: SupplySource;
}
