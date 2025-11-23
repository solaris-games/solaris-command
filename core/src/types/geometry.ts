export interface HexCoord {
  q: number;
  r: number;
  s: number;
}

// Helper to ensure valid Cube Coordinates
export function isValidHex(h: HexCoord): boolean {
  return h.q + h.r + h.s === 0;
}