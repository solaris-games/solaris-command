import { CombatTables } from "../data/combat-tables";
import { SPECIALIST_STEP_ID_MAP } from "../data/specialists";
import {
  CombatOperation,
  CombatReport,
  CombatResultType,
} from "../types/combat";
import { HexCoordsId } from "../types/geometry";
import { Hex } from "../types/hex";
import { SpecialistStepTypes, Unit, UnitStatus } from "../types/unit";
import { CombatCalculator } from "./combat-calculator";
import { HexUtils } from "./hex-utils";
import { MapUtils } from "./map-utils";
import { UnitManager } from "./unit-manager";

export const CombatEngine = {
  validateBattle(
    attacker: Unit,
    defender: Unit,
    hex: Hex,
    operation: CombatOperation,
    advanceOnVictory: boolean,
  ) {
    if (attacker.state.status !== UnitStatus.PREPARING)
      throw new Error("Attacker must be 'PREPARING' to order to attack.");

    if (attacker.state.ap === 0)
      throw new Error("Attacker does not have enough AP to attack.");

    if (!HexUtils.isNeighbor(attacker.location, hex.location))
      throw new Error("Defender's hex is not adjacent to attacker.");

    if (!hex.unitId)
      throw new Error("Defender's hex is not occupied by a unit.");

    if (operation === CombatOperation.SUPPRESSIVE_FIRE) {
      // Must have Artillery Specialist for suppressive fire attacks.
      const hasArtillery = UnitManager.unitHasActiveSpecialistStep(attacker);

      if (!hasArtillery) {
        throw new Error(
          "Attacker cannot perform Suppressive Fire without an active Artillery specialist.",
        );
      }
    }
  },

  /**
   * RESOLVE BATTLE
   * This function mutates the unit objects in memory.
   * It returns a Report + a flag indicating if the attacker took the hex.
   */
  resolveBattle(
    attacker: Unit,
    defender: Unit,
    hexLookup: Map<HexCoordsId, Hex>,
    operation: CombatOperation,
    advanceOnVictory: boolean,
  ): {
    report: CombatReport;
    attackerHex: Hex;
    defenderHex: Hex;
    retreatHex: Hex | null;
    attackerWonHex: boolean;
  } {
    // 1. Setup Context
    const defenderHex = hexLookup.get(HexUtils.getCoordsID(defender.location))!;
    const attackerHex = hexLookup.get(HexUtils.getCoordsID(attacker.location))!;

    // Combat is complicated and we should do some defensive programming here.
    // Validate that the battle is in the right state before proceeding.
    CombatEngine.validateBattle(
      attacker,
      defender,
      defenderHex,
      operation,
      advanceOnVictory,
    );

    // 2. Calculate & Predict
    // We pass the requested operation (defaulting to STANDARD if undefined)
    const prediction = CombatCalculator.calculate(
      attacker,
      defender,
      defenderHex,
      operation,
    );

    // 3. Get Result (Deterministic or Forced)
    const resultEntry = prediction.forcedResult
      ? prediction.forcedResult
      : CombatTables.getResult(prediction.finalScore);

    // 4. Apply Damage (Attacker)
    // Note: We kill steps first, then suppress the remaining steps.
    attacker.steps = UnitManager.killSteps(
      attacker.steps,
      resultEntry.attacker.losses,
    );
    attacker.steps = UnitManager.suppressSteps(
      attacker.steps,
      resultEntry.attacker.suppressed,
    );

    // 5. Apply Damage (Defender)
    defender.steps = UnitManager.killSteps(
      defender.steps,
      resultEntry.defender.losses,
    );
    defender.steps = UnitManager.suppressSteps(
      defender.steps,
      resultEntry.defender.suppressed,
    );

    // 6. Check for Destruction
    const attackerAlive = attacker.steps.length > 0;
    const defenderAlive = defender.steps.length > 0;

    let outcome = resultEntry.resultType;
    let defenderRetreated = false;
    let defenderShattered = false;

    // Handle unit deaths
    // If either unit died, remove the unit reference from the hex.
    if (!attackerAlive) {
      attackerHex.unitId = null;
    }

    if (!defenderAlive) {
      defenderHex.unitId = null;
    }

    // Handle Retreat / Shatter Logic
    let retreatHex: Hex | null = null;

    if (defenderAlive && attackerAlive && resultEntry.defender.retreat) {
      retreatHex = CombatEngine.findRetreatHex(defender, attacker, hexLookup);

      if (retreatHex) {
        UnitManager.moveUnit(defender, defenderHex, retreatHex, null);

        // Successful Retreat
        defenderRetreated = true;
        outcome = CombatResultType.RETREAT;
      } else {
        // Cornered -> Shattered!
        defender.steps = UnitManager.suppressSteps(defender.steps, 999);
        defenderShattered = true;
        outcome = CombatResultType.SHATTERED;
      }
    }

    // Handle Advance on Victory (Blitz)
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
      const mpCost = MapUtils.getHexMPCost(defenderHex, attacker.playerId);

      if (advanceOnVictory && attacker.state.mp > mpCost) {
        attacker.movement.path = [defenderHex.location];

        UnitManager.moveUnit(attacker, attackerHex, defenderHex, mpCost);

        attackerWonHex = true;
      }
    }

    // In suppressive fire attacks, suppress the first artillery specialist.
    // (There must be at least one artillery specialist to execute this type of attack)
    if (operation === CombatOperation.SUPPRESSIVE_FIRE) {
      const firstArtSpec = attacker.steps
        .filter((s) => s.specialistId && !s.isSuppressed)
        .find((s) => {
          const specCtlg = SPECIALIST_STEP_ID_MAP.get(s.specialistId!)!;

          return specCtlg.type === SpecialistStepTypes.ARTILLERY;
        })!;

      firstArtSpec.isSuppressed = true;
    }

    // If the outcome is 'overrun' then allow the attacker to
    // attack again; they do not lose an action point for this attack.
    if (outcome !== CombatResultType.OVERRUN) {
      // Deduct AP Cost
      // We deduct 1 AP for the attack action.
      attacker.state.ap = Math.max(0, attacker.state.ap - 1);
    }

    // 10. Generate Report
    const report: CombatReport = {
      tick: 0, // Controller should inject current tick
      cycle: 0,
      attackerPlayerId: attacker.playerId,
      attackerUnitId: attacker._id,
      defenderPlayerId: defender.playerId,
      defenderUnitId: defender._id,
      hexId: defenderHex._id,
      location: defenderHex.location,
      odds: `${prediction.oddsRatio}:1`,
      finalScore: prediction.finalScore, // The "Net Score"
      outcome,
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

    return { report, attackerHex, defenderHex, retreatHex, attackerWonHex };
  },

  /**
   * Helper: Find the best hex to retreat to.
   */
  findRetreatHex(
    unit: Unit,
    threat: Unit,
    hexLookup: Map<HexCoordsId, Hex>,
  ): Hex | null {
    const neighbors = HexUtils.neighbors(unit.location);
    const validRetreats: Hex[] = [];

    for (const coord of neighbors) {
      const hexId = HexUtils.getCoordsID(coord);
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

    validRetreats.sort((a, b) => {
      const mpCostA = MapUtils.getHexMPCost(a, unit.playerId);
      const mpCostB = MapUtils.getHexMPCost(b, unit.playerId);

      return mpCostA - mpCostB;
    });

    return validRetreats[0] ?? null;
  },
};
