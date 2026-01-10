export interface PlayerColor {
  key: string;
  alias: string;
  background: string; // Hex code
  foreground: string; // Hex code, either "#ffffff" or "#000000"
}

export interface PlayerColors {
  group: string;
  colours: PlayerColor[];
}
