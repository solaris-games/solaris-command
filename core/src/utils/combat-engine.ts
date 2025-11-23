import { ObjectId } from 'mongodb';
import { Game } from '../models/game';
import { Unit } from '../models/unit';
import { UnitStatus } from '../types/unit'
import { Map as GameMap } from '../models/map';
import { Hex } from '../models/hex';
import { CombatReport, CombatResultType } from '../types/combat';
import { CombatCalculator } from './combat-calculator';
import { CombatTables } from '../data/combat-tables';
import { HexUtils } from './hex-utils';
import { UnitManagerHelper as UnitUtils } from './unit-manager';

export const CombatEngine = {

  /**
   * RESOLVE BATTLE
   * This function mutates the unit objects in memory.
   * It returns a Report + a flag indicating if the attacker took the hex.
   */
  resolveBattle(
    attacker: Unit, 
    defender: Unit, 
    map: GameMap, 
    settings: { advanceOnVictory: boolean }
  ): { report: CombatReport, attackerWonHex: boolean } {
    
    // 1. Setup Context
    const hexKey = HexUtils.getID(defender.location);
    const hex = map.hexes.find(h => HexUtils.getID(h.coords) === hexKey)!;
    
    // 2. Calculate & Predict
    const prediction = CombatCalculator.calculate(attacker, defender, hex);
    
    // 3. Get Deterministic Result
    const resultEntry = CombatTables.getResult(prediction.finalScore);

    // 4. Apply Damage (Attacker)
    // Note: We modify the unit in place. Save to DB happens in the Controller.
    attacker.steps = UnitUtils.suppressSteps(attacker.steps, resultEntry.attacker.suppressed);
    attacker.steps = UnitUtils.killSteps(attacker.steps, resultEntry.attacker.steps);

    // 5. Apply Damage (Defender)
    defender.steps = UnitUtils.suppressSteps(defender.steps, resultEntry.defender.suppressed);
    defender.steps = UnitUtils.killSteps(defender.steps, resultEntry.defender.steps);

    // 6. Check for Destruction
    const attackerAlive = attacker.steps.length > 0;
    const defenderAlive = defender.steps.length > 0;
    
    let outcome = resultEntry.resultType;
    let defenderRetreated = false;
    let defenderShattered = false;

    // 7. Handle Retreat / Shatter Logic
    // Retreat happens if the CRT says so, OR if the unit broke (0 steps left logic handled elsewhere, but here we handle displacement)
    if (defenderAlive && attackerAlive) {
      if (resultEntry.defender.retreat) {
        const retreatHex = CombatEngine.findRetreatHex(defender, attacker, map);
        
        if (retreatHex) {
          // Successful Retreat
          defender.location = retreatHex.coords;
          defender.status = UnitStatus.REGROUPING;
          defenderRetreated = true;
          outcome = CombatResultType.RETREAT;
        } else {
          // Cornered -> Shattered!
          // Rule: All remaining steps suppressed (or killed if we want to be harsher)
          defender.steps = UnitUtils.suppressSteps(defender.steps, 999);
          defenderShattered = true;
          outcome = CombatResultType.KILL; // Effective kill
        }
      }
    }

    // 8. Handle Advance on Victory (Blitz)
    // If defender is gone (Dead or Retreated) AND Attacker is alive
    let attackerWonHex = false;
    if (attackerAlive && (!defenderAlive || defenderRetreated)) {
      if (settings.advanceOnVictory && attacker.stats.mp > 0) {
        attacker.location = defender.location; // Move into the hex
        attackerWonHex = true;
      }
    }

    // 9. Set Cooldowns
    if (attackerAlive) attacker.status = UnitStatus.REGROUPING;
    if (defenderAlive && !defenderRetreated) defender.status = UnitStatus.REGROUPING;

    // 10. Generate Report
    const report: CombatReport = {
      tick: 0, // Controller should inject current tick
      attackerId: attacker._id,
      defenderId: defender._id,
      hex: hex.coords,
      odds: `${prediction.oddsRatio}:1`, // Visual string
      roll: prediction.finalScore,       // The "Net Score"
      
      attacker: {
        combatValue: prediction.attackPower,
        shifts: prediction.shifts,
        losses: resultEntry.attacker
      },
      defender: {
        combatValue: prediction.defensePower,
        shifts: [], // Defender shifts usually part of the calculation, not separate list
        losses: resultEntry.defender,
        retreated: defenderRetreated,
        shattered: defenderShattered
      }
    };

    return { report, attackerWonHex };
  },

  /**
   * Helper: Find the best hex to retreat to.
   * Logic: Lowest Movement Cost -> Closest to Capital -> Random
   */
  findRetreatHex(unit: Unit, threat: Unit, map: GameMap): Hex | null {
    const neighbors = HexUtils.neighbors(unit.location);
    const validRetreats: Hex[] = [];

    for (const coord of neighbors) {
      const hexId = HexUtils.getID(coord);
      const hex = map.hexes.find(h => HexUtils.getID(h.coords) === hexId);

      // 1. Must exist and be passable
      if (!hex || hex.isImpassable) continue;

      // 2. Must not contain another unit
      // Note: In a full implementation, pass the 'units' array to check collision
      if (hex.unitId) continue; 

      // 3. Must not be the hex the attacker came from (Don't run into the gun)
      if (HexUtils.equals(coord, threat.location)) continue;

      validRetreats.push(hex);
    }

    if (validRetreats.length === 0) return null;

    // Sort: Lowest Terrain Cost first
    // Tiebreaker: Distance to Player Capital (assuming we have that data, otherwise random)
    // For now, simple Terrain sort:
    validRetreats.sort((a, b) => {
        // We'd use calculateMoveCost here usually
        const costA = (a.terrain === 'EMPTY') ? 1 : 2; 
        const costB = (b.terrain === 'EMPTY') ? 1 : 2;
        return costA - costB;
    });

    return validRetreats[0];
  }
};