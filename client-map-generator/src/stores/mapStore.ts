import { reactive } from 'vue';
import { TerrainTypes } from '@solaris-command/core/src/types/hex';
import { CONSTANTS } from '@solaris-command/core/src/data/constants';

// We need a partial hex type that fits our needs (we don't need all DB fields)
// But strictly we want to output Partial<Hex> and Partial<Planet>
// For internal state, we need coordinates key.

export interface EditorHex {
  q: number;
  r: number;
  s: number;
  terrain: TerrainTypes;
  hasPlanet: boolean;
  isCapital: boolean; // if hasPlanet is true
}

interface MapState {
  radius: number;
  playerCount: number;
  mapId: string;
  victoryPointsToWin: number;
  hexes: Map<string, EditorHex>; // Key is "q,r,s"

  selectedTerrain: TerrainTypes | 'PLANET' | 'CAPITAL' | null;
}

export const mapStore = reactive<MapState>({
  radius: 5,
  playerCount: 2,
  mapId: 'new-map',
  hexes: new Map(),
  victoryPointsToWin: CONSTANTS.GAME_DEFAULT_VICTORY_POINTS_TO_WIN,
  selectedTerrain: TerrainTypes.EMPTY
});

export function getHexKey(q: number, r: number, s: number): string {
  return `${q},${r},${s}`;
}

export function generateMap() {
  mapStore.hexes.clear();
  const radius = mapStore.radius;

  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
        const s = -q - r;
        const key = getHexKey(q, r, s);
        mapStore.hexes.set(key, {
            q, r, s,
            terrain: TerrainTypes.EMPTY,
            hasPlanet: false,
            isCapital: false
        });
    }
  }
}
