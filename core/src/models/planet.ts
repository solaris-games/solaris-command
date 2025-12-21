import { UnifiedId } from "../types";
import { HexCoords } from "../types/geometry";
import { SupplySource } from "../types/supply";

export interface Planet {
  _id: UnifiedId;
  gameId: UnifiedId;
  playerId: UnifiedId | null;

  hexId: UnifiedId;
  location: HexCoords;

  name: string;
  isCapital: boolean;
  supply: SupplySource;
}
