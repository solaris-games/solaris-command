import {
  TERRAIN_COMBAT_SHIFTS,
  SPECIALIST_STEP_ID_MAP,
  UNIT_CATALOG_ID_MAP,
} from "../data";
import { Unit, Hex, TerrainTypes } from "../models";
import {
  CombatShift,
  CombatShiftType,
  SpecialistStepTypes,
  CombatOperation,
  CombatResultType,
  CombatForcedResult,
} from "../types";

export interface CombatPrediction {
  attackPower: number;
  defensePower: number;
  oddsRatio: number; // Raw ratio (e.g. 1.5)
  oddsScore: number; // The base score derived from ratio (e.g. +1)
  shifts: CombatShift[];
  finalScore: number;
  forcedResult: CombatForcedResult | null; // If set, this result is applied directly without a dice roll
}

const MAX_ARMOR_SHIFT = 3;

export const CombatCalculator = {
  /**
   * Main entry point: Predict the outcome of A vs B in Hex X
   */
  calculate(
    attacker: Unit,
    defender: Unit,
    hex: Hex,
    operation: CombatOperation = CombatOperation.STANDARD
  ): CombatPrediction {
    // 1. Calculate Raw Power (Steps + Specialists)
    const attackPower = this.getUnitPower(attacker, true);
    const defensePower = this.getUnitPower(defender, false);

    // 2. Calculate Base Odds Score (The Ratio)
    const def = Math.max(1, defensePower);
    const att = Math.max(1, attackPower);
    const ratio = att / def;

    // Use explicit bracketing for Wargame Odds
    const oddsScore = this.getOddsScore(ratio);

    // 3. Calculate Modifiers (Shifts)
    const shifts = this.calculateShifts(attacker, defender, hex);

    // 4. Sum it up
    const totalShiftValue = shifts.reduce((sum, s) => sum + s.value, 0);
    const finalScore = oddsScore + totalShiftValue;

    // 5. Handle Combat Operations (Overrides)
    let forcedResult: CombatForcedResult | null = null;

    if (operation === CombatOperation.FEINT) {
      // Feint: 1 Suppress vs 1 Suppress (Fixed)
      forcedResult = {
        attacker: { steps: 0, suppressed: 1 },
        defender: { steps: 0, suppressed: 1, retreat: false, shattered: false },
        resultType: CombatResultType.SUPPRESS,
      };
    } else if (operation === CombatOperation.SUPPRESSIVE_FIRE) {
      // Validation: Must have Artillery Specialist
      const hasArtillery = attacker.steps.some((s) => {
        if (!s.specialistId || s.isSuppressed) return false;
        const spec = SPECIALIST_STEP_ID_MAP.get(s.specialistId);
        return spec?.type === SpecialistStepTypes.ARTILLERY;
      });

      if (!hasArtillery) {
        throw new Error(
          "Unit cannot perform Suppressive Fire without an active Artillery specialist."
        );
      }

      // Suppressive Fire: 0 vs 2 Suppress (Fixed)
      forcedResult = {
        attacker: { steps: 0, suppressed: 0 },
        defender: { steps: 0, suppressed: 2, retreat: false, shattered: false },
        resultType: CombatResultType.SUPPRESS,
      };
    }

    return {
      attackPower: att,
      defensePower: def,
      oddsRatio: parseFloat(ratio.toFixed(2)),
      oddsScore,
      shifts,
      finalScore,
      forcedResult,
    };
  },

  /**
   * Helper: Sum up active steps and specialist bonuses
   */
  getUnitPower(unit: Unit, isAttacking: boolean): number {
    const unitCtlg = UNIT_CATALOG_ID_MAP.get(unit.catalogId)!;

    // Count Active Steps (Base Stats)
    const activeSteps = unit.steps.filter((s) => !s.isSuppressed).length;

    let power = isAttacking
      ? unitCtlg.stats.attack * activeSteps
      : unitCtlg.stats.defense * activeSteps;

    // Add Specialist Bonuses
    unit.steps.forEach((step) => {
      if (!step.isSuppressed && step.specialistId) {
        const specialist = SPECIALIST_STEP_ID_MAP.get(step.specialistId)!;

        power += isAttacking
          ? specialist.stats.attack
          : specialist.stats.defense;
      }
    });

    return Math.round(power);
  },

  /**
   * Helper: Determine all active Shifts
   */
  calculateShifts(attacker: Unit, defender: Unit, hex: Hex): CombatShift[] {
    const attackerUnitCtlg = UNIT_CATALOG_ID_MAP.get(attacker.catalogId)!;
    const defenderUnitCtlg = UNIT_CATALOG_ID_MAP.get(defender.catalogId)!;

    const shifts: CombatShift[] = [];

    // --- 1. Terrain Shifts (Defender Bonus) ---
    const terrainShift = TERRAIN_COMBAT_SHIFTS[hex.terrain];

    if (terrainShift) {
      shifts.push(terrainShift);
    }

    // --- 2. Specialist: MARINES (Siege) ---
    // Marines negate fortification bonuses on Stations/Industrial
    if (hex.terrain === TerrainTypes.INDUSTRIAL_ZONE) {
      const siegeVal = this.getSpecialistShiftSum(attacker, "siege");
      if (siegeVal > 0) {
        // Use the specific SIEGE type for clarity in UI reports
        shifts.push({ type: CombatShiftType.SIEGE, value: siegeVal });
      }
    }

    // --- 3. Specialist: ARTILLERY ---
    const artilleryVal = this.getSpecialistShiftSum(attacker, "artillery");
    if (artilleryVal > 0) {
      shifts.push({ type: CombatShiftType.ARTILLERY, value: artilleryVal });
    }

    // --- 4. Armor vs Torpedoes ---
    // Rule: Armor Shift applies if Attacker Armor > Defender Armor.
    // Exception: If Defender has Active Torpedoes, Armor Shift is negated.

    const defenderHasTorpedo = defender.steps.some((s) => {
      const hasTorpedoSpec = s.specialistId
        ? SPECIALIST_STEP_ID_MAP.get(s.specialistId)!.type ===
          SpecialistStepTypes.TORPEDO
        : false;

      return !s.isSuppressed && hasTorpedoSpec;
    });

    if (!defenderHasTorpedo) {
      const armorDiff =
        (attackerUnitCtlg.stats.armor || 0) -
        (defenderUnitCtlg.stats.armor || 0);

      // Only Attacker gets armor bonus in offensive combat (Heavy ships crushing light ships)
      // If defender has better armor, it usually just reflects in their high Defense stat,
      // preventing a high Ratio score, so we don't apply negative shifts here typically.
      if (armorDiff > 0) {
        shifts.push({
          type: CombatShiftType.ARMOR,
          value: Math.min(MAX_ARMOR_SHIFT, armorDiff),
        });
      }
    } else {
      // Optional: Add a visual indicator that Armor was negated?
      // shifts.push({ type: 'TORPEDO_PIERCE', value: 0 });
    }

    return shifts;
  },

  /**
   * Helper: Sum up a specific stat from all active specialists
   */
  getSpecialistShiftSum(
    unit: Unit,
    stat: "artillery" | "siege" | "armor"
  ): number {
    return unit.steps.reduce((sum, step) => {
      if (!step.isSuppressed && step.specialistId) {
        const specialist = SPECIALIST_STEP_ID_MAP.get(step.specialistId)!;

        return sum + (specialist.stats[stat] || 0);
      }
      return sum;
    }, 0);
  },

  /**
   * Helper: Convert raw ratio to Wargame Odds Score
   * 1:3 or worse -> -3
   * 1:2 -> -2
   * 1:1.5 -> -1
   * 1:1 -> 0
   * 1.5:1 -> +1
   * 2:1 -> +2
   * 3:1 or better -> +3
   */
  getOddsScore(ratio: number): number {
    if (ratio >= 3.0) return 3;
    if (ratio >= 2.0) return 2;
    if (ratio >= 1.5) return 1;
    if (ratio >= 1.0) return 0;
    
    // For defender advantage (ratio < 1), we inverse it to find the bracket
    // e.g. Ratio 0.66 is 1:1.5 => Inverse is 1.5
    const inverse = 1 / ratio;
    
    if (inverse >= 3.0) return -3;
    if (inverse >= 2.0) return -2;
    if (inverse >= 1.5) return -1;
    
    return 0; // Fallback for 1:1 to 1:1.49 range (technically should be caught by ratio >= 1.0 check but floating point safety)
  },
};
