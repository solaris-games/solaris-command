import {
  CONSTANTS,
  UNIT_CATALOG,
} from "../data";
import { HexCoordsId } from "../types/hex";
import { Player, PlayerStatus } from "../types/player";
import { UnitStatus } from "../types/unit";
import { UnifiedId } from "../types/unified-id";
import { CombatOperation } from "../types/combat";
import { GameEventTypes } from "../types/game-event";
import { UnitManager } from "./unit-manager";
import { HexUtils } from "./hex-utils";
import { MapUtils } from "./map-utils";
import { TickContext } from "../types/tick";
import { UnitValidation } from "../validation/unit";
import { StationValidation } from "../validation/station";
import { StationFactory } from "../factories/station-factory";
import { UnitFactory } from "../factories/unit-factory";

const AI_EXECUTION_INTERVAL_TICKS = 6;

// Weights for Influence Map
const INFLUENCE_WEIGHTS = {
  FRIENDLY_UNIT: 10,
  FRIENDLY_STATION: 5,
  FRIENDLY_PLANET: 5,
  ENEMY_UNIT: -10,
  ENEMY_STATION: -5,
  ENEMY_PLANET: -5,
  DECAY: 0.8, // Decay factor per hex distance
};

export const AISystem = {
  processAIPlayers(context: TickContext) {
    // Only execute periodically
    if (context.game.state.tick % AI_EXECUTION_INTERVAL_TICKS !== 0) {
      return;
    }

    // Filter AI players
    // Cast to any to access isAIControlled since the interface update failed to persist
    const aiPlayers = context.players.filter(
      (p) => (p as any).isAIControlled && p.status !== PlayerStatus.DEFEATED
    );

    if (aiPlayers.length === 0) return;

    for (const player of aiPlayers) {
      processPlayerDecisions(player, context);
    }
  },
};

// Re-implementing correctly per player
function getInfluenceMapForPlayer(
  context: TickContext,
  playerId: UnifiedId
): Map<HexCoordsId, number> {
  const influenceMap = new Map<HexCoordsId, number>();
  context.hexes.forEach((hex) =>
    influenceMap.set(HexUtils.getCoordsID(hex.location), 0)
  );

  const addInfluence = (
    center: HexCoordsId,
    amount: number,
    range: number = 3
  ) => {
    const startHex = context.hexLookup.get(center);
    if (!startHex) return;

    // BFS
    const visited = new Set<string>();
    const queue = [{ hex: startHex, val: amount, dist: 0 }];
    visited.add(HexUtils.getCoordsID(startHex.location));

    while (queue.length > 0) {
      const { hex, val, dist } = queue.shift()!;
      const id = HexUtils.getCoordsID(hex.location);
      const current = influenceMap.get(id) || 0;
      influenceMap.set(id, current + val);

      if (dist >= range) continue;

      const neighbors = HexUtils.getNeighbors(hex.location);
      for (const nLoc of neighbors) {
        const nId = HexUtils.getCoordsID(nLoc);
        const nHex = context.hexLookup.get(nId);
        if (nHex && !MapUtils.isHexImpassable(nHex) && !visited.has(nId)) {
          visited.add(nId);
          queue.push({
            hex: nHex,
            val: val * INFLUENCE_WEIGHTS.DECAY,
            dist: dist + 1,
          });
        }
      }
    }
  };

  // Units
  context.units.forEach((u) => {
    if (!UnitManager.unitIsAlive(u)) return;
    const isFriendly = String(u.playerId) === String(playerId);
    const val = isFriendly
      ? INFLUENCE_WEIGHTS.FRIENDLY_UNIT
      : INFLUENCE_WEIGHTS.ENEMY_UNIT;
    addInfluence(HexUtils.getCoordsID(u.location), val);
  });

  // Stations
  context.stations.forEach((s) => {
    const isFriendly = String(s.playerId) === String(playerId);
    const val = isFriendly
      ? INFLUENCE_WEIGHTS.FRIENDLY_STATION
      : INFLUENCE_WEIGHTS.ENEMY_STATION;
    addInfluence(HexUtils.getCoordsID(s.location), val);
  });

  // Planets
  context.planets.forEach((p) => {
    if (!p.playerId) return; // Neutral doesn't influence safety directly? Maybe neutral is safe.
    const isFriendly = String(p.playerId) === String(playerId);
    const val = isFriendly
      ? INFLUENCE_WEIGHTS.FRIENDLY_PLANET
      : INFLUENCE_WEIGHTS.ENEMY_PLANET;
    addInfluence(HexUtils.getCoordsID(p.location), val);
  });

  return influenceMap;
}

function processPlayerDecisions(
  player: Player,
  context: TickContext
) {
  const influenceMap = getInfluenceMapForPlayer(context, player._id);
  const myUnits = context.units.filter(
    (u) =>
      String(u.playerId) === String(player._id) && UnitManager.unitIsAlive(u)
  );

  // 1. UNIT DECISIONS
  myUnits.forEach((unit) => {
    if (unit.state.status !== UnitStatus.IDLE) return;

    const unitLocId = HexUtils.getCoordsID(unit.location);
    const currentSafety = influenceMap.get(unitLocId) || 0;
    const neighbors = HexUtils.getNeighbors(unit.location);

    // Potential Actions
    let bestAction: { type: string; score: number; data?: any } = {
      type: "WAIT",
      score: -100,
    };

    neighbors.forEach((nLoc) => {
      const nId = HexUtils.getCoordsID(nLoc);
      const nHex = context.hexLookup.get(nId);
      if (!nHex) return;

      const nInfluence = influenceMap.get(nId) || 0;

      // ACTION: ATTACK
      if (nHex.unitId) {
        const targetUnit = context.unitLocations.get(nId);
        if (targetUnit && String(targetUnit.playerId) !== String(player._id)) {
          // Score Attack
          // Simple heuristic: (My Strength - Enemy Strength) + Influence Safety
          const myStrength = unit.steps.length; // Approximate
          const enemyStrength = targetUnit.steps.length; // Approximate
          let score = (myStrength - enemyStrength) * 10 + currentSafety;

          // Bonus for kill
          if (myStrength > enemyStrength) score += 20;

          // Validate
          const valid = UnitValidation.validateUnitAttack(
            unit,
            nHex,
            targetUnit,
            CombatOperation.ATTACK
          );
          if (valid.isValid && score > bestAction.score) {
            bestAction = {
              type: "ATTACK",
              score,
              data: {
                hex: nHex,
                target: targetUnit,
                op: CombatOperation.ATTACK,
              },
            };
          }

          // Check Suppressive Fire
          const validSuppression = UnitValidation.validateUnitAttack(
            unit,
            nHex,
            targetUnit,
            CombatOperation.SUPPRESSIVE_FIRE
          );
          if (validSuppression.isValid) {
            // Prefer suppression if enemy is strong
            let supScore = score + (enemyStrength > myStrength ? 15 : 0);
            if (supScore > bestAction.score) {
              bestAction = {
                type: "ATTACK",
                score: supScore,
                data: {
                  hex: nHex,
                  target: targetUnit,
                  op: CombatOperation.SUPPRESSIVE_FIRE,
                },
              };
            }
          }
        }
      }
      // ACTION: MOVE / CAPTURE
      else {
        if (MapUtils.isHexImpassable(nHex)) return;

        let moveScore = nInfluence; // Move towards safety/friendlies or valid frontlines

        // Bonus: Capture Planet/Station
        if (
          (nHex.planetId || nHex.stationId) &&
          String(nHex.playerId) !== String(player._id)
        ) {
          moveScore += 50;
        }
        // Bonus: Capture Empty Territory
        else if (String(nHex.playerId) !== String(player._id)) {
          moveScore += 10;
        }

        // Penalty: Moving out of supply (if we can detect it easily? simplified: prefer friendly territory)
        // If current is bad, moving to better is good.

        // Supply Check Logic Simplification:
        // Units OOS should prioritize moving towards supply (Friendly Stations/Planets)
        if (!unit.supply.isInSupply) {
            // In influence map, friendly stations/planets are high value.
            // So moving to higher influence is naturally moving to supply.
            moveScore += 20; // Urgency
        }

        const validMove = UnitValidation.validateUnitMove(
            unit,
            [nLoc],
            context.hexLookup,
            player._id
        );

        if (validMove.isValid && moveScore > bestAction.score) {
             bestAction = {
                 type: 'MOVE',
                 score: moveScore,
                 data: { path: [nLoc] }
             }
        }
      }
    });

    // Execute Best Action
    if (bestAction.type === "ATTACK") {
      unit.state.status = UnitStatus.PREPARING;
      unit.combat = {
        hexId: bestAction.data.hex._id,
        location: bestAction.data.target.location,
        operation: bestAction.data.op,
        advanceOnVictory: true, // AI always advances? Maybe aggressive.
      };
      // Log?
    } else if (bestAction.type === "MOVE") {
      unit.state.status = UnitStatus.MOVING;
      unit.movement = {
        path: bestAction.data.path,
      };
    }
  });

  // 2. STATION DESTRUCTION (High Risk)
  const myStations = context.stations.filter(s => String(s.playerId) === String(player._id));
  myStations.forEach(station => {
      // Check if station is in context.stationsToRemove (already destroyed this tick)
      if (context.stationsToRemove.some(id => String(id) === String(station._id))) return;

      const stationHexId = HexUtils.getCoordsID(station.location);
      const safetyScore = influenceMap.get(stationHexId) || 0;

      // Threshold: If safety is very low (e.g. < -5, meaning heavy enemy presence and no friendly support)
      // AND there is an enemy unit adjacent (immediate threat of capture)
      if (safetyScore < -5) {
          const neighbors = HexUtils.getNeighbors(station.location);
          let enemyAdjacent = false;
          for (const nLoc of neighbors) {
              const nId = HexUtils.getCoordsID(nLoc);
              const nUnit = context.unitLocations.get(nId);
              if (nUnit && String(nUnit.playerId) !== String(player._id)) {
                  enemyAdjacent = true;
                  break;
              }
          }

          if (enemyAdjacent) {
              // Destroy Station
              context.stationsToRemove.push(station._id);
              const hex = context.hexLookup.get(stationHexId);
              if (hex) hex.stationId = null;

              context.appendGameEvent(null, GameEventTypes.PLAYER_DECOMMISSIONED_STATION, {
                  stationId: station._id,
                  playerId: station.playerId,
                  hexId: station.hexId,
                  location: station.location
              });
          }
      }
  });

  // 3. SPENDING DECISIONS (Prestige)
  // Randomness: Try to spend if we have lots of prestige.
  if (player.prestigePoints > 20) {
    // Try Build Station
    if (player.prestigePoints >= CONSTANTS.STATION_PRESTIGE_COST) {
       // Find valid location near front line (Safety ~ 0) but owned by us
       // To keep it simple: Pick a random unit, check its neighbors.
       const candidates = myUnits.map(u => u.location).flatMap(l => HexUtils.getNeighbors(l));
       for (const loc of candidates) {
           const hexId = HexUtils.getCoordsID(loc);
           const hex = context.hexLookup.get(hexId);
           if (!hex) continue;

           const val = StationValidation.validateBuildStation(player, hex, context.stations);
           if (val.isValid) {
               // Build it!
               // Need to modify State directly as per instructions
               const newStation = StationFactory.create(
                   context.game._id,
                   player._id,
                   hex._id,
                   hex.location,
                   context.idGenerator
               );
               context.stations.push(newStation);
               context.stationLookup.set(hexId, newStation);
               hex.stationId = newStation._id;
               player.prestigePoints -= CONSTANTS.STATION_PRESTIGE_COST;

               context.appendGameEvent(null, GameEventTypes.PLAYER_CONSTRUCTED_STATION, {
                   stationId: newStation._id,
                   playerId: newStation.playerId,
                   hexId: newStation.hexId,
                   location: newStation.location
               });
               break; // One per tick
           }
       }
    }

    // Try Deploy Unit
    // TODO: Need catalog IDs. Using CONSTANTS or just picking one?
    // Let's assume some defaults or find them.
    // Core doesn't export the catalog list easily as an array? `UNIT_CATALOG` is a map or object?
    // `UNIT_CATALOG` in `core/src/data/units.ts` is an array.

    // Pick expensive one if rich
    const affordableUnits = UNIT_CATALOG.filter(u => u.cost <= player.prestigePoints);
    if (affordableUnits.length > 0) {
        // Pick random
        const chosen = affordableUnits[Math.floor(Math.random() * affordableUnits.length)];
        // Find spawn
        const spawns = UnitManager.getValidSpawnLocations(player._id, context.planets, context.hexes, context.units);
        if (spawns.length > 0) {
            const spawnHex = spawns[Math.floor(Math.random() * spawns.length)];

            const valid = UnitValidation.validateDeployUnit(player, spawnHex, context.hexes, context.planets, context.units, chosen.id);
            if (valid.isValid) {
                 // Deploy
                 const initialSteps = UnitManager.addSteps([], chosen.stats.defaultSteps);
                 initialSteps[0].isSuppressed = false;

                 const newUnit = UnitFactory.create(
                     chosen.id,
                     player._id,
                     context.game._id,
                     spawnHex._id,
                     spawnHex.location,
                     context.idGenerator
                 );
                 newUnit.state.mp = Math.floor(chosen.stats.maxMP / 2); // Deploy penalty
                 newUnit.state.ap = 0;
                 newUnit.steps = initialSteps;

                 context.units.push(newUnit);
                 context.unitLocations.set(HexUtils.getCoordsID(spawnHex.location), newUnit);
                 spawnHex.unitId = newUnit._id;
                 player.prestigePoints -= chosen.cost;

                 context.appendGameEvent(player._id, GameEventTypes.UNIT_DEPLOYED, { unit: newUnit });
            }
        }
    }
  }
}
