import { UNIT_CATALOG } from "../data";
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
import { UnitFactory } from "../factories/unit-factory";
import { HexCoordsId } from "../types/geometry";
import { SupplyEngine } from "./supply-engine";
import { CombatCalculator } from "./combat-calculator";
import { COMBAT_SHIFTS_TERRAIN } from "../data/terrain";
import { Hex } from "../types/hex";

const AI_EXECUTION_INTERVAL_TICKS = 1;

// Weights for Influence Map
const INFLUENCE_WEIGHTS = {
  FRIENDLY_UNIT: 1,
  FRIENDLY_STATION: 5,
  FRIENDLY_PLANET: 10,
  ENEMY_UNIT: -1,
  ENEMY_STATION: -5,
  ENEMY_PLANET: -10,
  DECAY: 0.8, // Decay factor per hex distance
};

export const AISystem = {
  processAIPlayers(context: TickContext) {
    // Only execute periodically
    if (context.game.state.tick % AI_EXECUTION_INTERVAL_TICKS !== 0) {
      return;
    }

    // Filter AI players
    const aiPlayers = context.players.filter(
      (p) => p.isAIControlled && p.status !== PlayerStatus.DEFEATED
    );

    if (aiPlayers.length === 0) return;

    for (const player of aiPlayers) {
      processAIPlayerDecisions(player, context);
    }
  },
};

// Generates an influence map which aids in AI player decision making.
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
    const visited = new Set<UnifiedId>();
    const queue = [{ hex: startHex, val: amount, dist: 0 }];
    visited.add(HexUtils.getCoordsID(startHex.location));

    while (queue.length > 0) {
      const { hex, val, dist } = queue.shift()!;
      const id = HexUtils.getCoordsID(hex.location);
      const current = influenceMap.get(id) || 0;
      influenceMap.set(id, current + val);

      if (dist >= range) continue;

      const neighbors = HexUtils.neighbors(hex.location);
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

function countFriendlyNeighbors(
  hex: Hex,
  context: TickContext,
  playerId: UnifiedId,
  excludeUnitId?: UnifiedId
): number {
  const neighbors = HexUtils.neighbors(hex.location);
  let count = 0;
  for (const nLoc of neighbors) {
    const nId = HexUtils.getCoordsID(nLoc);
    const nUnit = context.unitLocations.get(nId);
    if (nUnit && String(nUnit.playerId) === String(playerId)) {
      if (excludeUnitId && String(nUnit._id) === String(excludeUnitId)) {
        continue;
      }
      count++;
    }
  }
  return count;
}

function processAIPlayerDecisions(player: Player, context: TickContext) {
  const influenceMap = getInfluenceMapForPlayer(context, player._id);
  const myAliveUnits = context.units.filter(
    (u) =>
      String(u.playerId) === String(player._id) && UnitManager.unitIsAlive(u)
  );
  const myAliveStations = context.stations.filter(
    (s) =>
      !context.stationsToRemove.some((id) => String(id) === String(s._id)) &&
      String(s.playerId) === String(player._id)
  );

  // Keep track of which hexes are going to be moved into
  // so that the AI can avoid bouncing units.
  const movementHexes = new Set<HexCoordsId>();

  const supplyNetwork = SupplyEngine.calculatePlayerSupplyNetwork(
    player._id,
    context.hexes,
    context.planets,
    myAliveStations
  );

  // 1. UNIT DECISIONS
  myAliveUnits.forEach((unit) => {
    if (unit.state.status !== UnitStatus.IDLE) {
        return;
    }

    const unitLocId = HexUtils.getCoordsID(unit.location);
    const unitHex = context.hexLookup.get(unitLocId)!;
    const neighbors = HexUtils.neighbors(unit.location);

    // --- Anvil Strategy (Calculated Wait Score) ---
    // Default wait score
    let waitScore = -25;

    // Check 1: Are we pinning an enemy? (Adjacent to Enemy Unit)
    let isPinning = false;
    for (const nLoc of neighbors) {
        const nId = HexUtils.getCoordsID(nLoc);
        const nUnit = context.unitLocations.get(nId);
        if (nUnit && String(nUnit.playerId) !== String(player._id)) {
            isPinning = true;
            break;
        }
    }

    // Check 3: Objective (Planet/Station)
    const isObjective = !!(unitHex.planetId || unitHex.stationId);

    // "Anvil" Logic: High Defense terrain is only useful if we are pinning an enemy.
    // If we are pinning (adjacent to enemy), we hold.
    // If we are just sitting in rocks alone, we should move to the front.
    if (isPinning) {
        waitScore = 80;
    }

    if (isObjective) {
        waitScore += 10;
        // Ensure objective holding is prioritized even if not strictly pinning yet (e.g. anticipating)
        if (waitScore < 50) waitScore = 50;
    }

    // Potential Actions
    let bestAction: { type: string; score: number; data?: any } = {
      type: "WAIT",
      score: waitScore,
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
          // Run a combat simulation to see if attacking this unit is favourable.
          const combatPrediction = CombatCalculator.calculate(
            unit,
            targetUnit,
            nHex,
            CombatOperation.STANDARD
          );

          // --- Killer Instinct (Combat Thresholding) ---
          let score = 0;
          const oddsScore = combatPrediction.oddsScore;

          // Tier 1: Guaranteed Kill (Odds 3:1 -> Score +3)
          if (oddsScore >= 3) {
            score = 1000 + (oddsScore * 10);
          }
          // Tier 2: Favorable Combat (Odds 1.5:1 -> Score +1)
          else if (oddsScore >= 1) {
             score = 500 + (oddsScore * 10);
          }
          // Tier 4: Desperation / Bad Attacks
          else {
             // If ratio is < 1.5:1, we penalize it heavily unless desperate.
             score = -100 + (oddsScore * 10);
          }

          // Validate
          const valid = UnitValidation.validateUnitAttack(
            unit,
            nHex,
            targetUnit,
            CombatOperation.STANDARD
          );
          if (valid.isValid && score > bestAction.score) {
            bestAction = {
              type: "ATTACK",
              score,
              data: {
                hex: nHex,
                target: targetUnit,
                op: CombatOperation.STANDARD,
              },
            };
          }
        }
      }
      // ACTION: MOVE / CAPTURE
      else {
        const hexCoordsId = HexUtils.getCoordsID(nHex.location);

        if (
          MapUtils.isHexImpassable(nHex) || // Hex can't be moved into
          nHex.unitId || // Hex is occupied by any unit
          movementHexes.has(hexCoordsId) // Hex is going to be moved into by a friendly unit (avoid bounces)
        )
          return;

        // --- Target Zero (Bell Curve) ---
        const MAX_INFLUENCE = 20;
        let moveScore = MAX_INFLUENCE - Math.min(MAX_INFLUENCE, Math.abs(nInfluence));

        // --- Shield Wall (Cohesion Bonus) ---
        // Pass current unit ID to exclude it from count (we can't support ourselves from our previous position)
        const friendlyNeighbors = countFriendlyNeighbors(nHex, context, player._id, unit._id);
        moveScore += friendlyNeighbors * 10;

        // --- ZOC Safety ---
        const inEnemyZOC = MapUtils.isHexInEnemyZOC(nHex, player._id);
        const hasSupport = friendlyNeighbors > 0; // "Support" implies friendly adjacent units at destination

        if (inEnemyZOC && !hasSupport) {
            moveScore -= 500;
        }

        // Bonus: Capture Planet/Station
        if (
          (nHex.planetId || nHex.stationId) &&
          String(nHex.playerId) !== String(player._id)
        ) {
          moveScore += 20;
        }
        // Bonus: Capture Empty Territory
        else if (String(nHex.playerId) !== String(player._id)) {
          moveScore += 5;
        }

        // Units OOS should prioritize moving towards supply
        if (!unit.supply.isInSupply && supplyNetwork.has(hexCoordsId)) {
          // In influence map, friendly stations/planets are high value.
          // So moving to higher influence is naturally moving to supply.
          moveScore += 10; // Urgency
        }

        const validMove = UnitValidation.validateUnitMove(
          unit,
          [nLoc],
          context.hexLookup,
          player._id
        );

        if (validMove.isValid && moveScore > bestAction.score) {
          bestAction = {
            type: "MOVE",
            score: moveScore,
            data: { path: [nLoc] },
          };
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

      movementHexes.add(HexUtils.getCoordsID(bestAction.data.path[0]));
    }
  });

  // 3. SPENDING DECISIONS (Prestige)
  // Randomness: Try to spend if we have lots of prestige.
  if (player.prestigePoints > 20) {
    // Try Deploy Unit
    // Pick a random one that we can afford
    const affordableUnits = UNIT_CATALOG.filter(
      (u) => u.cost <= player.prestigePoints
    );

    if (affordableUnits.length > 0) {
      const chosen =
        affordableUnits[Math.floor(Math.random() * affordableUnits.length)];

      // Find spawn
      const spawns = UnitManager.getValidSpawnLocations(
        player._id,
        context.planets,
        context.hexes,
        context.units
      );

      if (spawns.length > 0) {
        const spawnHex = spawns[Math.floor(Math.random() * spawns.length)];

        const valid = UnitValidation.validateDeployUnit(
          player,
          spawnHex,
          context.hexes,
          context.planets,
          context.units,
          chosen.id
        );

        if (valid.isValid) {
          // Deploy
          // Generate initial steps. All but one should be suppressed.
          const initialSteps = UnitManager.addSteps(
            [],
            chosen.stats.defaultSteps
          );

          initialSteps[0].isSuppressed = false; // The first step should not be suppressed.

          const newUnit = UnitFactory.create(
            chosen.id,
            player._id,
            context.game._id,
            spawnHex._id,
            spawnHex.location,
            context.idGenerator
          );

          // Manual override for deploy stats
          // Units start with half MP
          newUnit.state.mp = Math.floor(chosen.stats.maxMP / 2);
          newUnit.state.ap = 0;
          newUnit.steps = initialSteps;

          context.units.push(newUnit);
          context.unitLocations.set(
            HexUtils.getCoordsID(spawnHex.location),
            newUnit
          );

          spawnHex.unitId = newUnit._id;
          player.prestigePoints -= chosen.cost;

          context.appendGameEvent(player._id, GameEventTypes.UNIT_DEPLOYED, {
            unit: newUnit,
          });
        }
      }
    }
  }
}
