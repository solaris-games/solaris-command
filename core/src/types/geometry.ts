export interface HexCoords {
  q: number;
  r: number;
  s: number;
}

export interface HexCoordsId extends String {} // For better type safety.

// Helper to ensure valid Cube Coordinates
export function isValidHex(h: HexCoords): boolean {
  return h.q + h.r + h.s === 0;
}
