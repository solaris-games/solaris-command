import { UnifiedId } from "../types";
import { HexCoords } from "../types/geometry";
import { SupplySource } from "../types/supply";

export interface Station {
  _id: UnifiedId;
  gameId: UnifiedId;
  playerId: UnifiedId;

  hexId: UnifiedId;
  location: HexCoords;
  
  supply: SupplySource;
}
