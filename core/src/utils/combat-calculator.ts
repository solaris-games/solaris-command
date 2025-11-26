import {
  TERRAIN_COMBAT_SHIFTS,
  SPECIALIST_STEP_ID_MAP,
  UNIT_CATALOG_ID_MAP,
} from "../data";
import { Unit, Hex, TerrainTypes } from "../models";
import { CombatShift, CombatShiftType, SpecialistStepTypes } from "../types";

export interface CombatPrediction {
  attackPower: number;
  defensePower: number;
  oddsRatio: number; // Raw ratio (e.g. 1.5)
  oddsScore: number; // The base score derived from ratio (e.g. +1)
  shifts: CombatShift[];
  finalScore: number;
}

export const CombatCalculator = {
  /**
   * Main entry point: Predict the outcome of A vs B in Hex X
   */
  calculate(attacker: Unit, defender: Unit, hex: Hex): CombatPrediction {
    // 1. Calculate Raw Power (Steps + Specialists)
    const attackPower = this.getUnitPower(attacker, true);
    const defensePower = this.getUnitPower(defender, false);

    // 2. Calculate Base Odds Score (The Ratio)
    // Avoid division by zero
    const def = Math.max(1, defensePower);
    const att = Math.max(1, attackPower);
    const ratio = att / def;

    // TODO: Move these ratios into core/src/data
    // Convert Ratio to Score (Standard Wargame Logic)
    // 1:1 = 0, 1.5:1 = +1, 2:1 = +2, 3:1 = +3
    // 1:1.5 = -1, 1:2 = -2
    let oddsScore = 0;
    if (ratio >= 1) {
      // Attacker Advantage
      oddsScore = Math.floor(ratio) - 1;
      // Cap base odds at +3 (So you need shifts to get to massacre levels)
      oddsScore = Math.min(3, oddsScore);
    } else {
      // Defender Advantage
      oddsScore = -Math.floor(def / att) + 1;
      oddsScore = Math.max(-3, oddsScore);
    }

    // 3. Calculate Modifiers (Shifts)
    const shifts = this.calculateShifts(attacker, defender, hex);

    // 4. Sum it up
    const totalShiftValue = shifts.reduce((sum, s) => sum + s.value, 0);
    const finalScore = oddsScore + totalShiftValue;

    return {
      attackPower: att,
      defensePower: def,
      oddsRatio: parseFloat(ratio.toFixed(2)),
      oddsScore,
      shifts,
      finalScore,
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
          value: Math.min(3, armorDiff),
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
};
