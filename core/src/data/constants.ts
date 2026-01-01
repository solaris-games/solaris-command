export const CONSTANTS = {
    // Supply
    SUPPLY_RANGE_MP_ROOT: 10,
    SUPPLY_RANGE_MP_NODE: 5,

    TERRAIN_MP_COST_ZOC_MULTIPLIER: 2,

    // Planets
    PLANET_PRESTIGE_INCOME_CAPITAL: 100,
    PLANET_PRESTIGE_INCOME: 50,

    // VP income is based on the rule of thumb of 8 player games 
    // with 8 planets per player; games should last ~2 weeks.
    PLANET_VP_INCOME_CAPITAL: 3, 
    PLANET_VP_INCOME: 1,

    UNIT_STEP_RECOVERY_RATE: 2, // Steps recovered per cycle
    UNIT_STEP_OOS_SUPPRESS_RATE: 2,
    UNIT_STEP_OOS_KILL_RATE: 3,
    UNIT_STEP_BASE_COST: 25,
    UNIT_STEP_SCRAP_PRESTIGE_REWARD: 10,

    // Vision
    PLANET_VISION_RANGE: 3,
    STATION_VISION_RANGE: 2,

    // Stations
    STATION_PRESTIGE_COST: 250,
    
    // Game Creation / Settings
    GAME_STARTING_PRESTIGE_POINTS: 500,
    GAME_STARTING_WARMUP_PERIOD_MS: 0, // DEV MODE ONLY // 4 * 60 * 60 * 1000, // 4 hours
    GAME_DEFAULT_TICK_DURATION_MS: 1 * 1000 * 10, // DEV MODE ONLY // 1 * 60 * 60 * 1000, // 1 hour
    GAME_DEFAULT_TICKS_PER_CYCLE: 24,
    GAME_DEFAULT_VICTORY_POINTS: 100,
    
    // Combat shift values
    COMBAT_SHIFT_ARMOR_TERRAIN_PENALTY: -1,
    COMBAT_SHIFT_ENTRENCHMENT_LOW: -1,
    COMBAT_SHIFT_ENTRENCHMENT_HIGH: -2,
    COMBAT_SHIFT_FORTIFICATIONS: -3,
    COMBAT_SHIFT_STEALTH_LOW: 1,
    COMBAT_SHIFT_STEALTH_HIGH: 2,
    COMBAT_SHIFT_MAX_ARMOR: 5,
    COMBAT_SHIFT_DEFENDER_DISORGANISED: 1,

    // Starting Config
    STARTING_FLEET_IDS: [
        "unit_corvette_01",
        "unit_frigate_01",
        "unit_destroyer_01"
    ]
}