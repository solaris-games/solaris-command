import { describe, it, expect, vi } from "vitest";
import { ObjectId } from "mongodb";
import { Unit, UnitStatus } from "../models";
import { UnitManager, UnitManagerHelper } from "./unit-manager";
import { UNIT_CATALOG_ID_MAP } from "../data";

// --- FACTORY HELPER ---
const CATALOG_UNIT_ID = "unit_frigate_01";
const CATALOG_UNIT = UNIT_CATALOG_ID_MAP.get(CATALOG_UNIT_ID)!;
const TICKS_PER_CYCLE = 24;

function createTestUnit(overrides: Partial<Unit> = {}): Unit {
  return {
    _id: new ObjectId(),
    gameId: new ObjectId(),
    playerId: new ObjectId(),
    catalogId: CATALOG_UNIT_ID,
    location: { q: 0, r: 0, s: 0 },
    steps: Array(5).fill({ isSuppressed: false, specialistId: null }), // 5 Active Steps
    state: {
      status: UnitStatus.IDLE,
      ap: 0,
      mp: 0,
      activeSteps: 5,
      suppressedSteps: 0,
    },
    supply: {
      isInSupply: true,
      ticksLastSupply: 0,
      ticksOutOfSupply: 0,
    },
    movement: { path: [] },
    combat: { hexId: null, cooldownEndTick: null },
    ...overrides,
  } as Unit;
}

describe("UnitManager", () => {
  describe("processCycle (In Supply)", () => {
    it("should refill AP and MP to max values", () => {
      const unit = createTestUnit({
        state: {
          status: UnitStatus.IDLE,
          ap: 0,
          mp: 0,
          activeSteps: 5,
          suppressedSteps: 0,
        },
      });

      const update = UnitManager.processCycle(unit, TICKS_PER_CYCLE);

      expect(update.state?.ap).toBe(CATALOG_UNIT.stats.maxAP);
      expect(update.state?.mp).toBe(CATALOG_UNIT.stats.maxMP);
    });

    it("should reset REGROPING status to IDLE", () => {
      const unit = createTestUnit({
        state: {
          status: UnitStatus.REGROUPING,
          ap: 0,
          mp: 0,
          activeSteps: 5,
          suppressedSteps: 0,
        },
      });

      const update = UnitManager.processCycle(unit, TICKS_PER_CYCLE);

      expect(update.state?.status).toBe(UnitStatus.IDLE);
    });

    it("should recover suppressed steps (up to Recovery Rate)", () => {
      // Setup: 3 Suppressed steps
      const steps = [
        { isSuppressed: true, specialistId: null },
        { isSuppressed: true, specialistId: null },
        { isSuppressed: true, specialistId: null },
        { isSuppressed: false, specialistId: null },
      ];

      const unit = createTestUnit({ steps });

      const update = UnitManager.processCycle(unit, TICKS_PER_CYCLE);

      // Expect: 2 recovered (Recovery Rate = 2), 1 still suppressed
      const suppressedCount = update.steps?.filter(
        (s) => s.isSuppressed
      ).length;
      expect(suppressedCount).toBe(1);
    });
  });

  describe("processCycle (Out of Supply)", () => {
    it("should handle Tier 1 OOS (1 Cycle / 24 ticks): No Recovery, but No Penalty", () => {
      const unit = createTestUnit({
        supply: {
          isInSupply: false,
          ticksOutOfSupply: 24,
          ticksLastSupply: 24,
        },
        // 1 suppressed step that should NOT recover
        steps: [{ isSuppressed: true, specialistId: null }],
      });

      const update = UnitManager.processCycle(unit, TICKS_PER_CYCLE);

      // Check: Normal AP/MP refill happens in Tier 1?
      // Logic check: Logic says "if (isInSupply) ... else { checks tiers }"
      // Tier 1 (cyclesOOS = 1) is not >= 2, so it falls through.
      // It gets AP/MP refill, but NO recovery.
      expect(update.state?.ap).toBe(CATALOG_UNIT.stats.maxAP);
      expect(update.steps![0].isSuppressed).toBe(true);
    });

    it("should handle Tier 2 OOS (2 Cycles): Starvation (0 AP, Suppress 2)", () => {
      const unit = createTestUnit({
        supply: {
          isInSupply: false,
          ticksOutOfSupply: 48,
          ticksLastSupply: 48,
        }, // 2 cycles
        steps: [
          { isSuppressed: false, specialistId: null },
          { isSuppressed: false, specialistId: null },
          { isSuppressed: false, specialistId: null },
        ],
      });

      const update = UnitManager.processCycle(unit, TICKS_PER_CYCLE);

      expect(update.state?.ap).toBe(0); // Starvation

      // Should suppress 2 steps
      const suppressed = update.steps?.filter((s) => s.isSuppressed).length;
      expect(suppressed).toBe(2);
    });

    it("should handle Tier 3 OOS (3 Cycles): Crippled (0 AP, Half MP, Suppress All)", () => {
      const unit = createTestUnit({
        supply: {
          isInSupply: false,
          ticksOutOfSupply: 72,
          ticksLastSupply: 72,
        }, // 3 cycles
        steps: [
          { isSuppressed: false, specialistId: null },
          { isSuppressed: false, specialistId: null },
        ],
      });

      const update = UnitManager.processCycle(unit, TICKS_PER_CYCLE);

      expect(update.state?.ap).toBe(0);
      expect(update.state?.mp).toBe(Math.ceil(CATALOG_UNIT.stats.maxMP / 2));

      // All steps suppressed
      const active = update.steps?.filter((s) => !s.isSuppressed).length;
      expect(active).toBe(0);
    });

    it("should handle Tier 4 OOS (4 Cycles): Collapse (Kill 3)", () => {
      const unit = createTestUnit({
        supply: {
          isInSupply: false,
          ticksOutOfSupply: 96,
          ticksLastSupply: 96,
        }, // 4 cycles
        steps: Array(5).fill({ isSuppressed: false, specialistId: null }),
      });

      const update = UnitManager.processCycle(unit, TICKS_PER_CYCLE);

      // Should kill 3 steps (5 - 3 = 2 remaining)
      expect(update.steps?.length).toBe(2);
      // Also applies Tier 3 effects (Suppress all remaining)
      const active = update.steps?.filter((s) => !s.isSuppressed).length;
      expect(active).toBe(0);
    });
  });
});

describe("UnitManagerHelper", () => {
  describe("killSteps (FIFO)", () => {
    it("should remove steps from the front (Index 0)", () => {
      const steps = [
        { isSuppressed: false, specialistId: "A" }, // 0
        { isSuppressed: false, specialistId: "B" }, // 1
        { isSuppressed: false, specialistId: "C" }, // 2
      ];

      const result = UnitManagerHelper.killSteps(steps, 2);

      expect(result.length).toBe(1);
      expect(result[0].specialistId).toBe("C"); // A and B died
    });
  });

  describe("suppressSteps (FIFO)", () => {
    it("should suppress the first N ACTIVE steps", () => {
      const steps = [
        { isSuppressed: true, specialistId: "A" }, // Already suppressed
        { isSuppressed: false, specialistId: "B" }, // Target 1
        { isSuppressed: false, specialistId: "C" }, // Target 2
        { isSuppressed: false, specialistId: "D" }, // Safe
      ];

      const result = UnitManagerHelper.suppressSteps(steps, 2);

      expect(result[0].isSuppressed).toBe(true); // Was already
      expect(result[1].isSuppressed).toBe(true); // Suppressed
      expect(result[2].isSuppressed).toBe(true); // Suppressed
      expect(result[3].isSuppressed).toBe(false); // Untouched
    });
  });

  describe("addSteps (Rear)", () => {
    it("should add new steps to the back as suppressed", () => {
      const steps = [{ isSuppressed: false, specialistId: "A" }];

      const result = UnitManagerHelper.addSteps(steps, 2);

      expect(result.length).toBe(3);
      // Old step is first
      expect(result[0].specialistId).toBe("A");
      // New steps are last
      expect(result[1].isSuppressed).toBe(true);
      expect(result[2].isSuppressed).toBe(true);
    });
  });

  describe("scrapSteps (Rear)", () => {
    it("should scrap steps from the back", () => {
      const steps = [
        { isSuppressed: false, specialistId: "A" },
        { isSuppressed: false, specialistId: "B" },
      ];

      const result = UnitManagerHelper.scrapSteps(steps, 1);

      expect(result.length).toBe(1);
      expect(result[0].specialistId).toBe("A");
    });
  });
});
