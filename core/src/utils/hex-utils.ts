import { HexCoords } from '../types/geometry';

// The 6 directions in Cube Coordinates
// Order: NE, E, SE, SW, W, NW
const HEX_DIRECTIONS: HexCoords[] = [
  { q: 1, r: 0, s: -1 },  // 0: East-ish
  { q: 1, r: -1, s: 0 },  // 1: North-East
  { q: 0, r: -1, s: 1 },  // 2: North-West
  { q: -1, r: 0, s: 1 },  // 3: West-ish
  { q: -1, r: 1, s: 0 },  // 4: South-West
  { q: 0, r: 1, s: -1 },  // 5: South-East
];

export const HexUtils = {
  /**
   * Check if two hexes are the exact same coordinate
   */
  equals(a: HexCoords, b: HexCoords): boolean {
    return a.q === b.q && a.r === b.r && a.s === b.s;
  },

  /**
   * Add two coordinates together
   */
  add(a: HexCoords, b: HexCoords): HexCoords {
    return { q: a.q + b.q, r: a.r + b.r, s: a.s + b.s };
  },

  /**
   * Subtract b from a
   */
  subtract(a: HexCoords, b: HexCoords): HexCoords {
    return { q: a.q - b.q, r: a.r - b.r, s: a.s - b.s };
  },

  /**
   * Multiply a hex by a scalar factor
   */
  scale(a: HexCoords, k: number): HexCoords {
    return { q: a.q * k, r: a.r * k, s: a.s * k };
  },

  /**
   * Calculate Manhattan distance between two hexes in the grid
   */
  distance(a: HexCoords, b: HexCoords): number {
    const vec = HexUtils.subtract(a, b);
    return (Math.abs(vec.q) + Math.abs(vec.r) + Math.abs(vec.s)) / 2;
  },

  /**
   * Get a specific neighbor direction vector (0-5)
   */
  direction(directionIndex: number): HexCoords {
    const index = Math.abs(directionIndex % 6); // Handle negative wrapping
    return HEX_DIRECTIONS[index];
  },

  /**
   * Get the specific neighbor at direction index
   */
  neighbor(hex: HexCoords, directionIndex: number): HexCoords {
    return HexUtils.add(hex, HexUtils.direction(directionIndex));
  },

  /**
   * Get all 6 immediate neighbors
   */
  neighbors(hex: HexCoords): HexCoords[] {
    return HEX_DIRECTIONS.map(dir => HexUtils.add(hex, dir));
  },

  /**
   * Get all hexes within a certain radius (filled circle)
   * Essential for: Supply Range, Sensor Range
   */
  getHexesInRange(center: HexCoords, range: number): HexCoords[] {
    const results: HexCoords[] = [];
    for (let q = -range; q <= range; q++) {
      // The logic here ensures we stay within the valid 's' plane
      const r1 = Math.max(-range, -q - range);
      const r2 = Math.min(range, -q + range);
      
      for (let r = r1; r <= r2; r++) {
        const s = -q - r;
        results.push(HexUtils.add(center, { q, r, s }));
      }
    }
    return results;
  },

  /**
   * Get only the hexes at the exact radius edge (hollow ring)
   * Essential for: Movement range border visualization
   */
  getHexesInRing(center: HexCoords, radius: number): HexCoords[] {
    if (radius <= 0) return [center];

    const results: HexCoords[] = [];
    
    // Start at the 'South-West' corner scaled by radius
    let hex = HexUtils.add(center, HexUtils.scale(HexUtils.direction(4), radius));

    // Walk around the ring: 6 directions * radius steps per side
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < radius; j++) {
        results.push(hex);
        hex = HexUtils.neighbor(hex, i);
      }
    }

    return results;
  },
  
  /**
   * Serialization: Get a unique string key for a hex
   * Format: "q,r,s"
   * Used for: Map keys, Set keys
   */
  getID(hex: HexCoords): string {
    return `${hex.q},${hex.r},${hex.s}`;
  },

  /**
   * Deserialization: Parse ID string back to object
   */
  parseID(id: string): HexCoords {
    const [q, r, s] = id.split(',').map(Number);
    return { q, r, s };
  }
};