import { ObjectId } from "mongodb";
import { HexCoords } from "../types/geometry";
import { SupplySource } from "../types/supply";

export interface Planet {
  _id: ObjectId;
  gameId: ObjectId;
  playerId: ObjectId | null;

  name: string;
  location: HexCoords; // TODO: This should be a hex ID or we add hexId to this model?
  supply: SupplySource;

  isCapital: boolean;

  // TODO: Do we need these for MVP? Can we use constants instead?
  prestigePointsPerCycle: number; // How much prestige is awarded to the player per cycle
  victoryPointsPerCycle: number;
}
