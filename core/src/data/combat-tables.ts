import { CombatResultType } from '../types/combat';

export interface CombatResultEntry {
  attacker: { 
    steps: number;      // Steps Killed
    suppressed: number; // Steps Suppressed
  };
  defender: { 
    steps: number; 
    suppressed: number; 
    retreat: boolean; 
    shattered: boolean; // If retreat is impossible, all steps suppressed
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
    attacker: { steps: 2, suppressed: 3 }, 
    defender: { steps: 0, suppressed: 0, retreat: false, shattered: false },
    resultType: CombatResultType.MISS 
  },

  // --- Defender Edge (-2) ---
  [-2]: { 
    attacker: { steps: 1, suppressed: 2 }, 
    defender: { steps: 0, suppressed: 0, retreat: false, shattered: false },
    resultType: CombatResultType.MISS 
  },

  // --- Slight Defender Edge (-1) ---
  [-1]: { 
    attacker: { steps: 0, suppressed: 2 }, 
    defender: { steps: 0, suppressed: 1, retreat: false, shattered: false },
    resultType: CombatResultType.SUPPRESS 
  },

  // --- Even Fight (0) ---
  // Both sides take a bruise. High attrition.
  0: { 
    attacker: { steps: 0, suppressed: 1 }, 
    defender: { steps: 0, suppressed: 1, retreat: false, shattered: false },
    resultType: CombatResultType.SUPPRESS
  },

  // --- Slight Attacker Edge (+1) ---
  1: { 
    attacker: { steps: 0, suppressed: 0 }, 
    defender: { steps: 0, suppressed: 2, retreat: false, shattered: false },
    resultType: CombatResultType.SUPPRESS
  },

  // --- Moderate Attacker Advantage (+2) ---
  2: { 
    attacker: { steps: 0, suppressed: 0 }, 
    defender: { steps: 1, suppressed: 2, retreat: false, shattered: false },
    resultType: CombatResultType.SUPPRESS
  },

  // --- Major Advantage (+3) ---
  // Defender starts losing hard or retreating
  3: { 
    attacker: { steps: 0, suppressed: 0 }, 
    defender: { steps: 2, suppressed: 3, retreat: true, shattered: false },
    resultType: CombatResultType.RETREAT
  },

  // --- Overwhelming (+4) ---
  4: { 
    attacker: { steps: 0, suppressed: 0 }, 
    defender: { steps: 3, suppressed: 3, retreat: true, shattered: false },
    resultType: CombatResultType.RETREAT
  },

  // --- Massacre (+5 or more) ---
  5: { 
    attacker: { steps: 0, suppressed: 0 }, 
    defender: { steps: 5, suppressed: 999, retreat: true, shattered: true },
    resultType: CombatResultType.SHATTERED
  }
};

export const CombatTables = {
  /**
   * Clamp the score to the table limits (-3 to +5)
   */
  getResult(score: number): CombatResultEntry {
    const MIN = -3;
    const MAX = 5;
    const clamped = Math.max(MIN, Math.min(MAX, Math.floor(score)));
    return COMBAT_RESULTS_TABLE[clamped];
  }
};