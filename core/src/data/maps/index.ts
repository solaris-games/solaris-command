import { GAME_MAP_TEST_1V1 } from "./map_test_1v1";
import { GAME_MAP_TEST_4_PLAYERS } from "./map_test_4_players";
import { GAME_MAP_6_PLAYER_FRAGMENT } from "./6-player-fragment";
import { GAME_MAP_6_PLAYER_RING } from "./6-player-ring";
import { GAME_MAP_8_PLAYER_SECTOR } from "./8-player-sector";

export const GAME_MAPS = [
  GAME_MAP_TEST_1V1,
  GAME_MAP_TEST_4_PLAYERS,
  GAME_MAP_6_PLAYER_FRAGMENT,
  GAME_MAP_6_PLAYER_RING,
  GAME_MAP_8_PLAYER_SECTOR
];

/**
 * Helpful RegEx for replacing terrain properties:
 * Find: terrain: "([A-Z_]+)"
 * Replace: terrain: TerrainTypes.$1
 */
