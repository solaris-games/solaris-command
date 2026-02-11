import { GAME_MAP_TEST_1V1 } from "./map_test_1v1";
import { GAME_MAP_TEST_4_PLAYERS } from "./map_test_4_players";
import { GAME_MAP_6_PLAYER_FRAGMENT } from "./6-player-fragment";
import { GAME_MAP_6_PLAYER_RING } from "./6-player-ring";
import { GAME_MAP_8_PLAYER_SECTOR } from "./8-player-sector";
import { GAME_MAP_8_PLAYER_RING } from "./8-player-ring";
import { GAME_MAP_8_PLAYER_VOID } from "./8-player-void";
import { GAME_MAP_8_PLAYER_BELT } from "./8-player-belt";

export const GAME_MAPS = [
  // GAME_MAP_TEST_1V1, // DEV MODE ONLY
  // GAME_MAP_TEST_4_PLAYERS, // DEV MODE ONLY
  GAME_MAP_6_PLAYER_FRAGMENT,
  GAME_MAP_6_PLAYER_RING,
  GAME_MAP_8_PLAYER_SECTOR,
  GAME_MAP_8_PLAYER_RING,
  GAME_MAP_8_PLAYER_VOID,
  GAME_MAP_8_PLAYER_BELT
];

/**
 * Helpful RegEx for replacing terrain properties:
 * Find: terrain: "([A-Z_]+)"
 * Replace: terrain: TerrainTypes.$1
 */
