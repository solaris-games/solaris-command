import { UnifiedId } from ".";
import { HexCoords } from "./geometry";
import { SupplySource } from "./supply";

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
