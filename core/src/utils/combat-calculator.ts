import { CombatForcedResult, CombatOperation, CombatResultType, CombatShift, CombatShiftType } from "../types/combat";
import { Hex } from "../types/hex";
import { SpecialistStepTypes, Unit, UnitStatus } from "../types/unit";
import { UnitManager } from "./unit-manager";
import { COMBAT_RESULT_FORCED_FEINT_ATTACK, COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE } from '../data/combat-tables'
import { UNIT_CATALOG_ID_MAP } from "../data/units";
import { SPECIALIST_STEP_ID_MAP } from "../data/specialists";
import { COMBAT_SHIFT_DEFENDER_DISORGANISED, COMBAT_SHIFT_PLANETS, COMBAT_SHIFTS_TERRAIN } from "../data/terrain";
import { CONSTANTS } from "../data/constants";

export interface CombatPrediction {
  attackPower: number;
  defensePower: number;
  oddsRatio: number; // Raw ratio (e.g. 1.5)
  oddsScore: number; // The base score derived from ratio (e.g. +1)
  shifts: CombatShift[];
  finalScore: number;
  forcedResult: CombatForcedResult | null; // If set, this result is applied directly
}

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
      forcedResult = COMBAT_RESULT_FORCED_FEINT_ATTACK;
    } else if (operation === CombatOperation.SUPPRESSIVE_FIRE) {
      // Suppressive Fire forced result:
      forcedResult = COMBAT_RESULT_FORCED_SUPPRESSIVE_FIRE;
    }

    return {
      attackPower: att,
      defensePower: def,
      oddsRatio: parseFloat(ratio.toFixed(0)),
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
    const activeSteps = UnitManager.getActiveSteps(unit).length;

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
    let shifts: CombatShift[] = [];

    // --- Defender disorganised shift (Attacker bonus) ---
    if (defender.state.status === UnitStatus.REGROUPING) {
      shifts.push(COMBAT_SHIFT_DEFENDER_DISORGANISED)
    }

    // --- Planet Shift (Defender Bonus) ---
    const planetShift = hex.planetId != null;

    if (planetShift) {
      shifts.push(COMBAT_SHIFT_PLANETS);
    }

    // --- Terrain Shifts (Attacker/Defender Bonus) ---
    const terrainShift = COMBAT_SHIFTS_TERRAIN[hex.terrain];

    if (terrainShift) {
      shifts.push(terrainShift);
    }

    // --- Specialist: ENGINEERS (Siege) ---
    // Engineers negate fortification bonuses on high defense hexes
    if (terrainShift && terrainShift.value < 0) {
      const siegeVal = this.getSpecialistShiftSum(attacker, "siege");

      if (siegeVal > 0) {
        shifts.push({ type: CombatShiftType.SIEGE, value: siegeVal });
      }
    }

    // --- Specialist: ARTILLERY ---
    const artilleryValAttacker = this.getSpecialistShiftSum(attacker, "artillery");

    if (artilleryValAttacker > 0) {
      shifts.push({ type: CombatShiftType.ARTILLERY, value: artilleryValAttacker });
    }

    const artilleryValDefender = this.getSpecialistShiftSum(defender, "artillery");

    if (artilleryValDefender > 0) {
      shifts.push({ type: CombatShiftType.ARTILLERY, value: -artilleryValDefender });
    }

    // --- Armour vs Torpedoes ---
    const armourShifts = this.getArmourShifts(attacker, defender, terrainShift);

    shifts = shifts.concat(armourShifts);

    return shifts;
  },

  /**
   * Helper: Sum up a specific stat from all active specialists
   */
  getSpecialistShiftSum(
    unit: Unit,
    stat: "artillery" | "siege" | "armour"
  ): number {
    return unit.steps.reduce((sum, step) => {
      if (!step.isSuppressed && step.specialistId) {
        const specialist = SPECIALIST_STEP_ID_MAP.get(step.specialistId)!;

        return sum + (specialist.stats[stat] || 0);
      }
      return sum;
    }, 0);
  },

  getArmourShifts(
    attacker: Unit,
    defender: Unit,
    terrainShift: CombatShift | null
  ): CombatShift[] {
    const attackerUnitCtlg = UNIT_CATALOG_ID_MAP.get(attacker.catalogId)!;
    const defenderUnitCtlg = UNIT_CATALOG_ID_MAP.get(defender.catalogId)!;

    const attackerSpecialistArmour = this.getSpecialistShiftSum(
      attacker,
      "armour"
    );
    const defenderSpecialistArmour = this.getSpecialistShiftSum(
      defender,
      "armour"
    );

    const attackerArmour =
      attackerUnitCtlg.stats.armour + attackerSpecialistArmour;
    const defenderArmour =
      defenderUnitCtlg.stats.armour + defenderSpecialistArmour;

    const shifts: CombatShift[] = [];

    // Armour shifts are for attackers only (including armour penalties)
    if (attackerArmour <= 0) {
      return shifts;
    }

    // When armoured units attack into hexes with defender shift
    if (terrainShift && terrainShift.value < 0) {
      shifts.push({
        type: CombatShiftType.ARMOUR_TERRAIN_PENALTY,
        value: CONSTANTS.COMBAT_SHIFT_ARMOUR_TERRAIN_PENALTY,
      });
    }

    // Rule: Armour Shift applies if Attacker Armour > Defender Armour.
    // Exception: If Defender has Active Torpedoes, Armour Shift is negated.
    const defenderHasTorpedo = defender.steps.some((s) => {
      const hasTorpedoSpec = s.specialistId
        ? SPECIALIST_STEP_ID_MAP.get(s.specialistId)!.type ===
          SpecialistStepTypes.TORPEDO
        : false;

      return !s.isSuppressed && hasTorpedoSpec;
    });

    if (defenderHasTorpedo) {
      shifts.push({
        type: CombatShiftType.ARMOUR_TORPEDO_PENALTY,
        value: -attackerArmour,
      });

      return shifts;
    }

    const armourDiff = attackerArmour - defenderArmour;

    // Only Attacker gets armour bonus in offensive combat (Heavy ships crushing light ships)
    // If defender has better armour, it usually just reflects in their high Defense stat,
    // preventing a high Ratio score, so we don't apply negative shifts here typically.
    if (armourDiff > 0) {
      shifts.push({
        type: CombatShiftType.ARMOUR,
        value: Math.min(CONSTANTS.COMBAT_SHIFT_MAX_ARMOUR, armourDiff),
      });
    }

    return shifts;
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
