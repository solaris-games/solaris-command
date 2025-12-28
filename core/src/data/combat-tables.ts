import { CombatResultType } from "../types/combat";

export interface CombatResultEntry {
  attacker: {
    losses: number; // Steps Killed
    suppressed: number; // Steps Suppressed
  };
  defender: {
    losses: number;
    suppressed: number;
    retreat: boolean; // If retreat is impossible, all steps suppressed
  };
  resultType: CombatResultType;
}

/**
 * THE COMBAT RESULTS TABLE (CRT)
 * Key = Net Score (Odds Score + Shift Modifiers)
 * * Logic:
 * - Negative Score: Defender Advantage
 * - 0: Even Match
 * - Positive Score: Attacker Advantage
 */
export const COMBAT_RESULTS_TABLE: Record<number, CombatResultEntry> = {
  // --- Defender Dominates (-3 or less) ---
  [-3]: {
    attacker: { losses: 5, suppressed: 0 },
    defender: { losses: 0, suppressed: 0, retreat: true },
    resultType: CombatResultType.MISS,
  },

  // --- Defender Edge (-2) ---
  [-2]: {
    attacker: { losses: 4, suppressed: 0 },
    defender: { losses: 0, suppressed: 1, retreat: false },
    resultType: CombatResultType.MISS,
  },

  // --- Slight Defender Edge (-1) ---
  [-1]: {
    attacker: { losses: 3, suppressed: 0 },
    defender: { losses: 0, suppressed: 2, retreat: false },
    resultType: CombatResultType.SUPPRESS,
  },

  // --- Even Fight (0) ---
  // Both sides take a bruise. High attrition.
  0: {
    attacker: { losses: 2, suppressed: 0 },
    defender: { losses: 1, suppressed: 3, retreat: false },
    resultType: CombatResultType.SUPPRESS,
  },

  // --- Slight Attacker Edge (+1) ---
  1: {
    attacker: { losses: 1, suppressed: 0 },
    defender: { losses: 1, suppressed: 3, retreat: false },
    resultType: CombatResultType.SUPPRESS,
  },

  // --- Moderate Attacker Advantage (+2) ---
  2: {
    attacker: { losses: 1, suppressed: 0 },
    defender: { losses: 1, suppressed: 3, retreat: false },
    resultType: CombatResultType.SUPPRESS,
  },

  // --- Major Advantage (+3) ---
  // Defender starts losing hard or retreating
  3: {
    attacker: { losses: 1, suppressed: 0 },
    defender: { losses: 2, suppressed: 3, retreat: true },
    resultType: CombatResultType.RETREAT,
  },

  // --- Overwhelming (+4) ---
  4: {
    attacker: { losses: 0, suppressed: 0 },
    defender: { losses: 2, suppressed: 3, retreat: true },
    resultType: CombatResultType.RETREAT,
  },

  // --- Massacre (+5 or more) ---
  5: {
    attacker: { losses: 0, suppressed: 0 },
    defender: { losses: 2, suppressed: 3, retreat: true },
    resultType: CombatResultType.SHATTERED,
  },

  6: {
    attacker: { losses: 0, suppressed: 0 },
    defender: { losses: 3, suppressed: 3, retreat: true },
    resultType: CombatResultType.SHATTERED,
  },

  7: {
    attacker: { losses: 0, suppressed: 0 },
    defender: { losses: 3, suppressed: 3, retreat: true },
    resultType: CombatResultType.SHATTERED,
  },

  8: {
    attacker: { losses: 0, suppressed: 0 },
    defender: { losses: 4, suppressed: 3, retreat: true },
    resultType: CombatResultType.SHATTERED,
  },

  9: {
    attacker: { losses: 0, suppressed: 0 },
    defender: { losses: 5, suppressed: 3, retreat: true },
    resultType: CombatResultType.SHATTERED,
  },
};

// Suppressive Fire: 0 vs 2 Suppress (Fixed)
export const COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE = {
  attacker: { losses: 0, suppressed: 0 },
  defender: { losses: 0, suppressed: 2, retreat: false },
  resultType: CombatResultType.SUPPRESS,
};

export const CombatTables = {
  /**
   * Clamp the score to the table limits (-3 to +9)
   */
  getResult(score: number): CombatResultEntry {
    const MIN = -3;
    const MAX = 9;
    const clamped = Math.max(MIN, Math.min(MAX, Math.floor(score)));
    return COMBAT_RESULTS_TABLE[clamped]!;
  },
};
