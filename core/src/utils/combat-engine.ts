import { CombatTables, TERRAIN_MP_COSTS } from "../data";
import { Unit, UnitStatus, Hex } from "../models";
import { CombatOperation, CombatReport, CombatResultType } from "../types";
import { CombatCalculator } from "./combat-calculator";
import { HexUtils } from "./hex-utils";
import { MapUtils } from "./map-utils";
import { UnitManagerHelper as UnitUtils } from "./unit-manager";

export const CombatEngine = {
  /**
   * RESOLVE BATTLE
   * This function mutates the unit objects in memory.
   * It returns a Report + a flag indicating if the attacker took the hex.
   */
  resolveBattle(
    attacker: Unit,
    defender: Unit,
    hexLookup: Map<string, Hex>,
    operation: CombatOperation,
    settings: {
      advanceOnVictory: boolean;
    }
  ): { report: CombatReport; attackerWonHex: boolean } {
    // 1. Setup Context
    const hexKey = HexUtils.getID(defender.location);
    const hex = hexLookup.get(hexKey)!;

    // 2. Calculate & Predict
    // We pass the requested operation (defaulting to STANDARD if undefined)
    const prediction = CombatCalculator.calculate(
      attacker,
      defender,
      hex,
      operation
    );

    // 3. Get Result (Deterministic or Forced)
    const resultEntry = prediction.forcedResult
      ? prediction.forcedResult
      : CombatTables.getResult(prediction.finalScore);

    // 4. Apply Damage (Attacker)
    attacker.steps = UnitUtils.suppressSteps(
      attacker.steps,
      resultEntry.attacker.suppressed
    );
    attacker.steps = UnitUtils.killSteps(
      attacker.steps,
      resultEntry.attacker.steps
    );

    // 5. Apply Damage (Defender)
    defender.steps = UnitUtils.suppressSteps(
      defender.steps,
      resultEntry.defender.suppressed
    );
    defender.steps = UnitUtils.killSteps(
      defender.steps,
      resultEntry.defender.steps
    );

    // 6. Check for Destruction
    const attackerAlive = attacker.steps.length > 0;
    const defenderAlive = defender.steps.length > 0;

    let outcome = resultEntry.resultType;
    let defenderRetreated = false;
    let defenderShattered = false;

    // 7. Handle Retreat / Shatter Logic
    if (defenderAlive && attackerAlive) {
      if (resultEntry.defender.retreat) {
        const retreatHex = CombatEngine.findRetreatHex(
          defender,
          attacker,
          hexLookup
        );

        if (retreatHex) {
          // Successful Retreat
          defender.location = retreatHex.coords;
          defender.state.status = UnitStatus.REGROUPING;
          defenderRetreated = true;
          outcome = CombatResultType.RETREAT;
        } else {
          // Cornered -> Shattered!
          defender.steps = UnitUtils.suppressSteps(defender.steps, 999);
          defenderShattered = true;
          outcome = CombatResultType.SHATTERED;
        }
      }
    }

    // 8. Handle Advance on Victory (Blitz)
    // Rule Check: Can only advance if the operation *allows* it.
    // E.g., Suppressive Fire should never advance even if the enemy dies.
    // Standard and Feint (if enemy retreats) allow it.
    let attackerWonHex = false;
    const operationAllowsAdvance =
      operation !== CombatOperation.SUPPRESSIVE_FIRE;

    if (
      attackerAlive &&
      (!defenderAlive || defenderRetreated) &&
      operationAllowsAdvance
    ) {
      if (settings.advanceOnVictory && attacker.state.mp > 0) {
        attacker.location = hex.coords;
        attackerWonHex = true;
      }
    }

    // 9. Set Cooldowns
    if (attackerAlive) attacker.state.status = UnitStatus.REGROUPING;
    if (defenderAlive && !defenderRetreated)
      defender.state.status = UnitStatus.REGROUPING;

    // 10. Generate Report
    const report: CombatReport = {
      tick: 0, // Controller should inject current tick
      attackerId: attacker._id,
      defenderId: defender._id,
      hex: hex.coords,
      odds: `${prediction.oddsRatio}:1`,
      roll: prediction.finalScore, // The "Net Score"

      attacker: {
        combatValue: prediction.attackPower,
        shifts: prediction.shifts,
        losses: resultEntry.attacker,
      },
      defender: {
        combatValue: prediction.defensePower,
        shifts: [],
        losses: resultEntry.defender,
        retreated: defenderRetreated,
        shattered: defenderShattered,
      },
    };

    return { report, attackerWonHex };
  },

  /**
   * Helper: Find the best hex to retreat to.
   */
  findRetreatHex(
    unit: Unit,
    threat: Unit,
    hexLookup: Map<string, Hex>
  ): Hex | null {
    const neighbors = HexUtils.neighbors(unit.location);
    const validRetreats: Hex[] = [];

    for (const coord of neighbors) {
      const hexId = HexUtils.getID(coord);
      const hex = hexLookup.get(hexId);

      // Must exist and be passable
      if (!hex || MapUtils.isHexImpassable(hex)) continue;

      // Must not contain another unit
      if (hex.unitId) continue;

      // Must not be the hex the attacker came from (Don't run into the gun)
      if (HexUtils.equals(coord, threat.location)) continue;

      validRetreats.push(hex);
    }

    if (validRetreats.length === 0) return null;

    validRetreats.sort(
      (a, b) => TERRAIN_MP_COSTS[a.terrain] - TERRAIN_MP_COSTS[b.terrain]
    );

    return validRetreats[0];
  },
};
