import { describe, it, expect, vi } from "vitest";
import { CombatCalculator } from "./combat-calculator";
import { Unit, UnitStatus, UnitStep } from "../types/unit";
import { MockUnifiedId } from "../types/unified-id";
import { Hex, TerrainTypes } from "../types/hex";
import { CombatOperation, CombatShiftType } from "../types/combat";

const CATALOG_UNIT_FRIGATE_ID = "unit_frigate_01";
const CATALOG_UNIT_BATTLESHIP_ID = "unit_battleship_01";
const CATALOG_SPEC_ARTILLERY_ID = "spec_artillery_01";
const CATALOG_SPEC_TORPEDO_ID = "spec_torpedo_01";
const CATALOG_SPEC_ENGINEERS_ID = "spec_engineers_01";

// --- FACTORY ---
function createTestUnit(
  catalogId: string,
  activeSteps: number,
  specialistIds: string[] = []
): Unit {
  // Create steps: Active normal steps + Active specialist steps
  const steps: UnitStep[] = [];

  // Add specialists first (assuming they are part of the active count for logic simplicity in factory,
  // though typically spec steps are added to the end. Logic doesn't care about order here).
  specialistIds.forEach((id) => {
    steps.push({ isSuppressed: false, specialistId: id });
  });

  // Fill remaining with normal steps
  const normalCount = activeSteps - specialistIds.length;
  for (let i = 0; i < normalCount; i++) {
    steps.push({ isSuppressed: false, specialistId: null });
  }

  return {
    _id: new MockUnifiedId(),
    gameId: new MockUnifiedId(),
    playerId: new MockUnifiedId(),
    catalogId: catalogId,
    hexId: new MockUnifiedId(),
    location: { q: 0, r: 0, s: 0 },
    steps: steps,
    state: {
      status: UnitStatus.IDLE,
      ap: 1,
      mp: 1,
    },
    supply: { isInSupply: true, ticksLastSupply: 0, ticksOutOfSupply: 0 },
    movement: { path: [] },
    combat: {
      hexId: null,
      location: null,
      operation: null,
      advanceOnVictory: null,
    },
  } as Unit;
}

function createHex(terrain: TerrainTypes): Hex {
  return {
    _id: new MockUnifiedId(),
    gameId: new MockUnifiedId(),
    unitId: null,
    location: { q: 0, r: 0, s: 0 },
    terrain: terrain,
    // supply field omitted for brevity as it's not used in calculator
  } as unknown as Hex;
}

describe("CombatCalculator", () => {
  describe("getUnitPower", () => {
    it("should calculate base power correctly", () => {
      // Frigate: Base Attack 2. 5 Steps. Total = 10.
      const unit = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);
      const power = CombatCalculator.getUnitPower(unit, true); // IsAttacking
      expect(power).toBe(10);
    });

    it("should add specialist bonuses", () => {
      // Frigate: Base Attack 2. 5 Steps (4 Normal + 1 Artillery).
      // Artillery Spec: Attack +2.
      // Calc: (2 + 2) * 5 steps = 20.
      const unit = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5, [
        CATALOG_SPEC_ARTILLERY_ID,
      ]);
      const power = CombatCalculator.getUnitPower(unit, true);
      expect(power).toBe(20);
    });

    it("should ignore suppressed steps", () => {
      const unit = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);
      // Suppress 2 steps
      unit.steps[0].isSuppressed = true;
      unit.steps[1].isSuppressed = true;

      // Active = 3. Power = 3 * 2 = 6.
      const power = CombatCalculator.getUnitPower(unit, true);
      expect(power).toBe(6);
    });
  });

  describe("calculate (Standard Operations)", () => {
    const emptyHex = createHex(TerrainTypes.EMPTY);

    it("should calculate Even odds (1:1) as Score 0", () => {
      // Frigate (10 Power) vs Frigate (10 Power)
      const attacker = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5); // 2*5 = 10
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5); // 2*5 = 10 (Def is same as Att)

      const result = CombatCalculator.calculate(attacker, defender, emptyHex);

      expect(result.forcedResult).toBe(null);
      expect(result.attackPower).toBe(10);
      expect(result.defensePower).toBe(10);
      expect(result.oddsRatio).toBe(1);
      expect(result.oddsScore).toBe(0);
      expect(result.finalScore).toBe(0);
    });

    it("should calculate Attacker Advantage (2:1) as Score +3", () => {
      const attacker = createTestUnit(CATALOG_UNIT_BATTLESHIP_ID, 5); // 6*5 = 30
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5); // 2*5 = 10

      const result = CombatCalculator.calculate(attacker, defender, emptyHex);

      expect(result.forcedResult).toBe(null);
      expect(result.oddsRatio).toBe(3);
      expect(result.oddsScore).toBe(3);
    });

    it("should calculate Defender Advantage (1:2) as Score -3", () => {
      const attacker = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5); // 10
      const defender = createTestUnit(CATALOG_UNIT_BATTLESHIP_ID, 5); // 5*5 = 25

      const result = CombatCalculator.calculate(attacker, defender, emptyHex);

      expect(result.forcedResult).toBe(null);
      expect(result.attackPower).toBe(10);
      expect(result.defensePower).toBe(30);
      expect(result.oddsScore).toBe(-3);
    });
  });

  describe("calculate (Combat Operations)", () => {
    const emptyHex = createHex(TerrainTypes.EMPTY);

    it("should return forced result for FEINT", () => {
      const attacker = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);

      const result = CombatCalculator.calculate(
        attacker,
        defender,
        emptyHex,
        CombatOperation.FEINT
      );

      expect(result.forcedResult).not.toBeNull();
      expect(result.forcedResult?.attacker.suppressed).toBe(1);
      expect(result.forcedResult?.defender.suppressed).toBe(1);
      expect(result.forcedResult?.attacker.losses).toBe(0);
    });

    it("should return forced result for SUPPRESSIVE_FIRE with Artillery", () => {
      const attacker = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5, [
        CATALOG_SPEC_ARTILLERY_ID,
      ]);
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);

      const result = CombatCalculator.calculate(
        attacker,
        defender,
        emptyHex,
        CombatOperation.SUPPRESSIVE_FIRE
      );

      expect(result.forcedResult).toBeDefined();
      expect(result.forcedResult?.attacker.suppressed).toBe(0); // Attacker safe
      expect(result.forcedResult?.defender.suppressed).toBe(2); // Defender hit
    });
  });

  describe("calculateShifts", () => {
    it("should apply defender disorganised shift", () => {
      const attacker = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);
      const emptyHex = createHex(TerrainTypes.EMPTY);

      defender.state.status = UnitStatus.REGROUPING;

      const result = CombatCalculator.calculate(attacker, defender, emptyHex);

      const shift = result.shifts.find(
        (s) => s.type === CombatShiftType.DEFENDER_DISORGANISED
      );
      expect(shift).toBeDefined();
      expect(shift?.value).toBe(1);
      expect(result.finalScore).toBe(1); // 0 (Odds) + 1 (Shift)
    });

    it("should apply Terrain Shifts", () => {
      const attacker = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);
      const asteroidHex = createHex(TerrainTypes.ASTEROID_FIELD);

      const result = CombatCalculator.calculate(
        attacker,
        defender,
        asteroidHex
      );

      const entrenchment = result.shifts.find(
        (s) => s.type === CombatShiftType.ENTRENCHMENT
      );
      expect(entrenchment).toBeDefined();
      expect(entrenchment?.value).toBe(-1);
      expect(result.finalScore).toBe(-1); // 0 (Odds) - 1 (Terrain)
    });

    it("should apply Terrain Shifts - Stealth", () => {
      const attacker = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);
      const asteroidHex = createHex(TerrainTypes.NEBULA);

      const result = CombatCalculator.calculate(
        attacker,
        defender,
        asteroidHex
      );

      const entrenchment = result.shifts.find(
        (s) => s.type === CombatShiftType.STEALTH
      );
      expect(entrenchment).toBeDefined();
      expect(entrenchment?.value).toBe(1);
      expect(result.finalScore).toBe(1);
    });

    it("should apply Armour Shift (Battleship vs Frigate)", () => {
      const attacker = createTestUnit(CATALOG_UNIT_BATTLESHIP_ID, 5); // Armour 2
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5); // Armour 0
      const emptyHex = createHex(TerrainTypes.EMPTY);

      const result = CombatCalculator.calculate(attacker, defender, emptyHex);

      // Armour Diff = 2. Shift should be +2.
      const armourShift = result.shifts.find(
        (s) => s.type === CombatShiftType.ARMOUR
      );
      expect(armourShift).toBeDefined();
      expect(armourShift?.value).toBe(3);
    });

    it("should apply Armour Shift with specialist", () => {
      const attacker = createTestUnit(CATALOG_UNIT_BATTLESHIP_ID, 5); // Armour 2
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5); // Armour 0
      const emptyHex = createHex(TerrainTypes.EMPTY);

      attacker.steps[0].specialistId = "spec_armour_01"; // Armour 1

      const result = CombatCalculator.calculate(attacker, defender, emptyHex);

      // Armour Diff = 3. Shift should be +3.
      const armourShift = result.shifts.find(
        (s) => s.type === CombatShiftType.ARMOUR
      );
      expect(armourShift).toBeDefined();
      expect(armourShift?.value).toBe(4);
    });

    it("should apply Artillery Shift", () => {
      // Attacker has Artillery Spec (+1 Arty Shift)
      const attacker = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5, [
        CATALOG_SPEC_ARTILLERY_ID,
      ]);
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);
      const emptyHex = createHex(TerrainTypes.EMPTY);

      const result = CombatCalculator.calculate(attacker, defender, emptyHex);

      const artyShift = result.shifts.find(
        (s) => s.type === CombatShiftType.ARTILLERY
      );
      expect(artyShift).toBeDefined();
      expect(artyShift?.value).toBe(1);
    });

    it("should apply Siege Shift vs Industrial Zones", () => {
      // Attacker has Marines (+2 Siege)
      const attacker = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5, [
        CATALOG_SPEC_ENGINEERS_ID,
      ]);
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);
      // Defending in Fortified Zone (-3 Fortification)
      const industrialHex = createHex(TerrainTypes.INDUSTRIAL_ZONE);

      const result = CombatCalculator.calculate(
        attacker,
        defender,
        industrialHex
      );

      // Should see Fortification (-3) AND Siege (+2)
      const fortShift = result.shifts.find(
        (s) => s.type === CombatShiftType.FORTIFICATIONS
      );
      const siegeShift = result.shifts.find(
        (s) => s.type === CombatShiftType.SIEGE
      );

      expect(fortShift?.value).toBe(-3);
      expect(siegeShift?.value).toBe(2);

      // Net should be -1
      const totalShift = result.shifts.reduce((a, b) => a + b.value, 0);
      expect(totalShift).toBe(-1);
    });

    it("should Negate Armour if Defender has Torpedoes", () => {
      const attacker = createTestUnit(CATALOG_UNIT_BATTLESHIP_ID, 5); // Armour 2
      // Defender has Torpedoes
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5, [
        CATALOG_SPEC_TORPEDO_ID,
      ]);
      const emptyHex = createHex(TerrainTypes.EMPTY);

      const result = CombatCalculator.calculate(attacker, defender, emptyHex);

      // Should have armour torpedo penalty
      const armourShift = result.shifts.find(
        (s) => s.type === CombatShiftType.ARMOUR_TORPEDO_PENALTY
      );
      expect(armourShift).not.toBeUndefined();
    });

    it("should Negate Armour if hex is fortified", () => {
      const attacker = createTestUnit(CATALOG_UNIT_BATTLESHIP_ID, 5); // Armour 2
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5);
      const hex = createHex(TerrainTypes.INDUSTRIAL_ZONE);

      const result = CombatCalculator.calculate(attacker, defender, hex);

      // Should have armour terrain penalty
      const armourShift = result.shifts.find(
        (s) => s.type === CombatShiftType.ARMOUR_TERRAIN_PENALTY
      );
      expect(armourShift).not.toBeUndefined();
    });
  });
});
