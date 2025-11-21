import { HexCoords } from '../types/geometry';

// The 6 directions in Cube Coordinates
// Order: NE, E, SE, SW, W, NW
const HEX_DIRECTIONS: HexCoords[] = [
  { q: 1, r: 0, s: -1 },
  { q: 1, r: -1, s: 0 },
  { q: 0, r: -1, s: 1 },
  { q: -1, r: 0, s: 1 },
  { q: -1, r: 1, s: 0 },
  { q: 0, r: 1, s: -1 },
];

export const HexUtils = {
  /**
   * Check if two hexes are the same
   */
  equals(a: HexCoords, b: HexCoords): boolean {
    return a.q === b.q && a.r === b.r && a.s === b.s;
  },

  /**
   * Add two coordinates
   */
  add(a: HexCoords, b: HexCoords): HexCoords {
    return { q: a.q + b.q, r: a.r + b.r, s: a.s + b.s };
  },

  /**
   * Calculate Manhatten distance between two hexes
   */
  distance(a: HexCoords, b: HexCoords): number {
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.s - b.s)) / 2;
  },

  /**
   * Get all 6 immediate neighbors
   */
  neighbors(hex: HexCoords): HexCoords[] {
    return HEX_DIRECTIONS.map(dir => HexUtils.add(hex, dir));
  },
  
  /**
   * Get a unique string key for a hex (useful for Maps/Sets)
   * Format: "q,r,s"
   */
  getID(hex: HexCoords): string {
    return `${hex.q},${hex.r},${hex.s}`;
  }
};