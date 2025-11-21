export interface SupplySource {
  supplyValue: number; // Base supply value
  supplyLevel: number; // Multiplier for supply range strength
  isInSupply: boolean; // Is it in range of the root supply source
  isRoot: boolean; // Is this a root supply source? If so it cannot go out of supply
}

export interface SupplyTarget {
  isInSupply: boolean; // Is in range of a planet or station supply.
  ticksLastSupply: number; // How many ticks have passed since the last time this unit was supplied
  ticksOutOfSupply: number; // How many ticks the unit has been out of supply for
}
