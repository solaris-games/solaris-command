import { UNIT_CATALOG_ID_MAP } from "../data";
import { Hex, Planet, Unit, UnitStatus, UnitStep } from "../models";
import { UnitSpecialistStepCatalogItem } from "../types";
import { HexUtils } from "./hex-utils";
import { MapUtils } from "./map-utils";

// Constants based on GDD
const STEP_RECOVERY_RATE = 2; // Steps recovered per cycle

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
        if (step.isSuppressed && recoveredCount < STEP_RECOVERY_RATE) {
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
        newSteps = UnitManagerHelper.suppressSteps(newSteps, 2);
      }

      // Tier 3: Crippled (3 Cycles) -> AP = 0, MP Halved, Suppress ALL
      if (cyclesOOS >= 3) {
        newAP = 0;
        newMP = Math.ceil(unitCtlg.stats.maxMP / 2);
        newSteps = UnitManagerHelper.suppressSteps(newSteps, 999); // Suppress all
      }

      // Tier 4: Collapse (4+ Cycles) -> Tier 3 + Destroy 3 Steps
      if (cyclesOOS >= 4) {
        newSteps = UnitManagerHelper.killSteps(newSteps, 3);
      }
    }

    // 3. Recalculate Derived Stats (Active Steps)
    // We calculate this here so we don't have to do O(N) counts every time we read the DB
    const activeSteps = newSteps.filter((s) => !s.isSuppressed).length;
    const suppressedSteps = newSteps.length - activeSteps;

    // 4. Status Check (Did it die?)
    if (newSteps.length === 0) {
      // Logic for "Destroyed" handled by caller, but we set stats to 0
      return {
        steps: [],
        state: { ...unit.state, activeSteps: 0, suppressedSteps: 0 },
      };
    }

    // 5. Reset Action States
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
        activeSteps,
        suppressedSteps,
      },
    };
  },

  /**
   * Find a valid spawn location for a new unit
   * Rules: Adjacent to Capital, Empty Hex, No Unit.
   */
  findSpawnLocation(
    playerCapital: Planet,
    hexes: Hex[],
    allUnits: Unit[]
  ): any | null {
    // Get all neighbors
    const candidates = HexUtils.neighbors(playerCapital.location);

    // Filter valid
    for (const coord of candidates) {
      const hexId = HexUtils.getID(coord);
      const hex = hexes.find((h) => HexUtils.getID(h.coords) === hexId);

      // Must exist and be passable
      if (!hex || MapUtils.isHexImpassable(hex)) continue;

      // Must be empty of units
      const isOccupied = allUnits.some(
        (u) => HexUtils.getID(u.location) === hexId
      );
      if (isOccupied) continue;

      // Found one!
      return coord;
    }

    return null; // Capital is surrounded/blockaded
  },
};

// --- Private Helpers ---

export const UnitManagerHelper = {
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
};
