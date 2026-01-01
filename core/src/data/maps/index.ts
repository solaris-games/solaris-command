import { GAME_MAP_TEST_1V1 } from "./map_test_1v1";
import { GAME_MAP_TEST_4_PLAYERS } from "./map_test_4_players";

export const GAME_MAPS = [GAME_MAP_TEST_1V1, GAME_MAP_TEST_4_PLAYERS];

/**
 * Helpful RegEx for replacing terrain properties:
 * Find: terrain: "([A-Z_]+)"
 * Replace: terrain: TerrainTypes.$1
 */
