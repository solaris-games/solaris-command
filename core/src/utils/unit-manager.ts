import {
  CONSTANTS,
  ERROR_CODES,
  SPECIALIST_STEP_ID_MAP,
  UNIT_CATALOG_ID_MAP,
} from "../data";
import { Hex, Planet, Unit, UnitStatus, UnitStep } from "../models";
import {
  HexCoordsId,
  SpecialistStepTypes,
  UnitSpecialistStepCatalogItem,
} from "../types";
import { HexUtils } from "./hex-utils";
import { MapUtils } from "./map-utils";

export const UnitManager = {
  /**
   * Process the Cycle for a single unit.
   * Handles: AP/MP Refill, Supply Recovery, OOS Penalties.
   * Returns: A set of updates to apply to the Unit in the DB.
   */
  processCycle(unit: Unit, ticksPerCycle: number): void {
    const unitCtlg = UNIT_CATALOG_ID_MAP.get(unit.catalogId)!;

    const isInSupply = unit.supply.isInSupply;

    if (isInSupply) {
      // The unit is now going to be supplied.
      unit.supply.ticksLastSupply = 0;
    }

    // Calculate the number of cycles since the unit was last supplied.
    const cyclesOOS = Math.floor(unit.supply.ticksLastSupply / ticksPerCycle);

    // 1. Initialize Logic Variables
    // Calculate Base Max Stats + Specialist Bonuses
    let calculatedMaxAP = unitCtlg.stats.maxAP;
    let calculatedMaxMP = unitCtlg.stats.maxMP;

    // Handle unit recovery first, then we will calculate MP/AP restoration.
    // Note that we do recovery first since some specialists provide MP/AP bonuses
    // and we want to do those AFTER step recovery.

    // 2. Handle Supply States (The "Stick" & "Carrot")

    if (isInSupply) {
      // --- RECOVERY LOGIC ---
      // Recover suppressed steps (FIFO - First In, First Out, or just simple iteration)
      let recoveredCount = 0;
      unit.steps = unit.steps.map((step) => {
        if (
          step.isSuppressed &&
          recoveredCount < CONSTANTS.UNIT_STEP_RECOVERY_RATE
        ) {
          recoveredCount++;
          return { ...step, isSuppressed: false };
        }
        return step;
      });
    }

    // --- CALCULATE BONUSES (Post-Recovery) ---
    // Now that we have the potentially recovered steps, we calculate MP/AP bonuses.
    // We only count active (non-suppressed) specialists.
    let mpMultiplier = 1;
    let apAdd = 0;

    unit.steps.forEach((step) => {
      if (!step.isSuppressed && step.specialistId) {
        const spec = SPECIALIST_STEP_ID_MAP.get(step.specialistId);
        if (spec && spec.bonuses) {
          if (spec.bonuses.mpMultiplier) {
            // Multiplicative stacking
            mpMultiplier *= spec.bonuses.mpMultiplier;
          }
          if (spec.bonuses.apAdd) {
            apAdd += spec.bonuses.apAdd;
          }
        }
      }
    });

    calculatedMaxMP = Math.floor(calculatedMaxMP * mpMultiplier);
    calculatedMaxAP = calculatedMaxAP + apAdd;

    unit.state.ap = calculatedMaxAP;
    unit.state.mp = calculatedMaxMP;

    if (!isInSupply) {
      // --- OOS PENALTY LOGIC ---
      // Based on GDD Tier List

      // Tier 2: Starvation (2 Cycles) -> AP = 0, Suppress 2 Steps
      if (cyclesOOS >= 2) {
        unit.state.ap = 0;
        unit.steps = UnitManager.suppressSteps(
          unit.steps,
          CONSTANTS.UNIT_STEP_OOS_SUPPRESS_RATE
        );
      }

      // Tier 3: Crippled (3 Cycles) -> AP = 0, MP Halved, Suppress ALL
      if (cyclesOOS >= 3) {
        unit.state.ap = 0;
        unit.state.mp = Math.ceil(calculatedMaxMP / 2);
        unit.steps = UnitManager.suppressSteps(unit.steps, 999); // Suppress all
      }

      // Tier 4: Collapse (4+ Cycles) -> Tier 3 + Destroy 3 Steps
      if (cyclesOOS >= 4) {
        unit.steps = UnitManager.killSteps(
          unit.steps,
          CONSTANTS.UNIT_STEP_OOS_KILL_RATE
        );
      }
    }
  },

  moveUnit(
    unit: Unit,
    source: Hex,
    destination: Hex,
    mpCost: number | null // null if not applicable
  ) {
    if (mpCost != null && unit.state.mp < mpCost) {
      throw new Error(ERROR_CODES.UNIT_INSUFFICIENT_MP);
    }

    if (mpCost != null && unit.movement.path.length === 0) {
      throw new Error(ERROR_CODES.UNIT_IS_NOT_MOVING);
    }

    // Move the unit
    unit.hexId = destination._id;
    unit.location = destination.location;

    // Update unit state
    if (mpCost != null) {
      unit.state.mp = Math.max(0, unit.state.mp - mpCost); // Reduce MP
      unit.movement.path.shift(); // Pop the step
    }

    // Update hexes
    source.unitId = null;
    destination.unitId = unit._id;
    destination.playerId = unit.playerId; // Capture the destination hex
  },

  /**
   * Finds valid spawn locations for a new unit
   * Rules: Adjacent to any player owned planet, Empty Hex, No Unit.
   */
  getValidSpawnLocations(
    playerId: any,
    planets: Planet[],
    hexes: Hex[],
    allUnits: Unit[]
  ): Hex[] {
    const playerPlanets = MapUtils.findPlayerPlanets(planets, playerId);

    const valid: Hex[] = [];

    // Get all neighbors of all player owned planets.
    const candidates = playerPlanets.flatMap((p) =>
      HexUtils.neighbors(p.location)
    );

    // Filter valid
    for (const coord of candidates) {
      const hexId = HexUtils.getCoordsID(coord);
      const hex = hexes.find((h) => HexUtils.equals(h.location, coord));

      // Must exist, be passable and not in enemy ZOC
      if (
        !hex ||
        MapUtils.isHexImpassable(hex) ||
        MapUtils.isHexInEnemyZOC(hex, playerId)
      )
        continue;

      // Must be empty of units
      const isOccupied = allUnits.some(
        (u) => HexUtils.getCoordsID(u.location) === hexId
      );
      if (isOccupied) continue;

      // Found one!
      valid.push(hex);
    }

    return valid; // If empty: Capital is surrounded/blockaded
  },

  getActiveSteps(unit: Unit) {
    return unit.steps.filter((s) => !s.isSuppressed);
  },

  getSuppressedSteps(unit: Unit) {
    return unit.steps.filter((s) => s.isSuppressed);
  },

  /**
   * Suppress N active steps (FIFO / Left-to-Right)
   * Scans from Index 0. Finds the first ACTIVE step and suppresses it.
   * Skips steps that are already suppressed.
   */
  suppressSteps(steps: UnitStep[], count: number): UnitStep[] {
    let suppressedCount = 0;

    // Map creates a new array, preserving order
    const newSteps = steps.map((step) => {
      // If we still need to suppress, and this step is currently active
      if (suppressedCount < count && !step.isSuppressed) {
        suppressedCount++;
        return { ...step, isSuppressed: true };
      }
      return step;
    });

    // Note: We do not intend to kill steps that have been suppressed more than once
    // because this would make suppression too powerful. Players would simply suppress units
    // with artillery instead of engaging in combat.

    return newSteps;
  },

  /**
   * Permanently remove N steps (FIFO / Left-to-Right)
   * "Meat Shield" logic: Steps at the front die first.
   * Specialist steps added to the end will survive the longest.
   */
  killSteps(steps: UnitStep[], count: number): UnitStep[] {
    // Create a shallow copy so we don't mutate the input directly before we are ready
    const remainingSteps = [...steps];

    // Remove 'count' elements starting from index 0
    // splice modifies the array in place
    if (count > 0) {
      remainingSteps.splice(0, count);
    }

    return remainingSteps;
  },

  /**
   * Add N new steps to the unit (Reinforcement).
   * New steps are always added to the REAR (End of array).
   * They start as Suppressed (as per GDD rules for new deployments).
   */
  addSteps(
    currentSteps: UnitStep[],
    count: number,
    specialist?: UnitSpecialistStepCatalogItem
  ): UnitStep[] {
    const newSteps: UnitStep[] = [];

    for (let i = 0; i < count; i++) {
      newSteps.push({
        isSuppressed: true, // New recruits need time to organize (Supply Cycle)
        specialistId: specialist?.id || null,
      });
    }

    // Concatenate: Old Veterans at front + New Recruits at back
    return [...currentSteps, ...newSteps];
  },

  /**
   * SCRAP steps (Optional Economy Feature)
   * Allows a player to voluntarily remove steps to free up cap/resources.
   * Should they be allowed to scrap from the Front (High damage/suppressed) or Back (New)?
   * Usually, you scrap the oldest/most damaged first? Or specific indices?
   * For simplicity: Scrapping removes from the REAR (canceling reinforcements).
   */
  scrapSteps(steps: UnitStep[], count: number): UnitStep[] {
    const remaining = [...steps];
    for (let i = 0; i < count; i++) {
      remaining.pop(); // Remove from End
    }
    return remaining;
  },

  unitHasActiveSpecialistStep(unit: Unit) {
    const hasArtillery = unit.steps.some((s) => {
      if (!s.specialistId || s.isSuppressed) return false;
      const spec = SPECIALIST_STEP_ID_MAP.get(s.specialistId);
      return spec?.type === SpecialistStepTypes.ARTILLERY;
    });

    return hasArtillery;
  },
};
