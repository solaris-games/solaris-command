import { ObjectId } from "mongodb";
import { CONSTANTS, SPECIALIST_STEP_ID_MAP, UNIT_CATALOG_ID_MAP } from "../data";
import { Hex, Planet, Unit, UnitStatus, UnitStep } from "../models";
import { SpecialistStepTypes, UnitSpecialistStepCatalogItem } from "../types";
import { HexUtils } from "./hex-utils";
import { MapUtils } from "./map-utils";

export const UnitManager = {
  /**
   * Process the Cycle for a single unit.
   * Handles: AP/MP Refill, Supply Recovery, OOS Penalties.
   * Returns: A set of updates to apply to the Unit in the DB.
   */
  processCycle(unit: Unit, ticksPerCycle: number): Partial<Unit> {
    const unitCtlg = UNIT_CATALOG_ID_MAP.get(unit.catalogId)!;

    const cyclesOOS = Math.floor(unit.supply.ticksOutOfSupply / ticksPerCycle);
    const isInSupply = unit.supply.isInSupply;

    // 1. Initialize Logic Variables
    let newAP = unitCtlg.stats.maxAP;
    let newMP = unitCtlg.stats.maxMP;
    let newSteps = [...unit.steps]; // Clone array to mutate
    let newStatus = unit.state.status;

    // 2. Handle Supply States (The "Stick" & "Carrot")

    if (isInSupply) {
      // --- RECOVERY LOGIC ---
      // Recover suppressed steps (FIFO - First In, First Out, or just simple iteration)
      let recoveredCount = 0;
      newSteps = newSteps.map((step) => {
        if (step.isSuppressed && recoveredCount < CONSTANTS.UNIT_STEP_RECOVERY_RATE) {
          recoveredCount++;
          return { ...step, isSuppressed: false };
        }
        return step;
      });
    } else {
      // --- OOS PENALTY LOGIC ---
      // Based on GDD Tier List

      // Tier 2: Starvation (2 Cycles) -> AP = 0, Suppress 2 Steps
      if (cyclesOOS >= 2) {
        newAP = 0;
        newSteps = UnitManagerHelper.suppressSteps(newSteps, CONSTANTS.UNIT_STEP_OOS_SUPPRESS_RATE);
      }

      // Tier 3: Crippled (3 Cycles) -> AP = 0, MP Halved, Suppress ALL
      if (cyclesOOS >= 3) {
        newAP = 0;
        newMP = Math.ceil(unitCtlg.stats.maxMP / 2);
        newSteps = UnitManagerHelper.suppressSteps(newSteps, 999); // Suppress all
      }

      // Tier 4: Collapse (4+ Cycles) -> Tier 3 + Destroy 3 Steps
      if (cyclesOOS >= 4) {
        newSteps = UnitManagerHelper.killSteps(newSteps, CONSTANTS.UNIT_STEP_OOS_KILL_RATE);
      }
    }

    // 3. Status Check (Did it die?)
    if (newSteps.length === 0) {
      // Logic for "Destroyed" handled by caller, but we set stats to 0
      return {
        steps: [],
        state: { ...unit.state },
      };
    }

    // 4. Reset Action States
    // If unit was 'PREPARING' or 'MOVING', do we reset it?
    // Usually, cycle resets happen at quiet times, but we should ensure AP/MP fill
    // doesn't override a specific locked state if needed.
    // For now, we assume Cycle refill happens peacefully.
    if (newStatus === UnitStatus.REGROUPING) {
      newStatus = UnitStatus.IDLE;
    }

    return {
      steps: newSteps,
      state: {
        ...unit.state,
        status: newStatus,
        ap: newAP,
        mp: newMP,
      },
    };
  },

  /**
   * Finds valid spawn locations for a new unit
   * Rules: Adjacent to any player owned planet, Empty Hex, No Unit.
   */
  getValidSpawnLocations(
    playerId: ObjectId,
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

      // Must exist and be passable
      if (!hex || MapUtils.isHexImpassable(hex)) continue;

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
};

// --- Private Helpers ---

export const UnitManagerHelper = {
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
    return steps.map((step) => {
      // If we still need to suppress, and this step is currently active
      if (suppressedCount < count && !step.isSuppressed) {
        suppressedCount++;
        return { ...step, isSuppressed: true };
      }
      return step;
    });
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
