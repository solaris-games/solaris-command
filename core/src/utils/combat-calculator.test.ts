import { describe, it, expect, vi } from "vitest";
import { CombatCalculator } from "./combat-calculator";
import { Unit, UnitStatuses, UnitStep } from "../models/unit";
import { Hex, TerrainTypes } from "../models/hex";
import { CombatShiftType } from "../types/combat";
import { ObjectId } from "mongodb";

const CATALOG_UNIT_FRIGATE_ID = "unit_frigate_01";
const CATALOG_UNIT_BATTLESHIP_ID = "unit_battleship_01";
const CATALOG_SPEC_ARTILLERY_ID = "spec_artillery_01";
const CATALOG_SPEC_TORPEDO_ID = "spec_torpedo_01";
const CATALOG_SPEC_MARINES_ID = "spec_marines_01";

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
    _id: new ObjectId(),
    gameId: new ObjectId(),
    playerId: new ObjectId(),
    catalogId: catalogId,
    location: { q: 0, r: 0, s: 0 },
    steps: steps,
    state: {
      status: UnitStatuses.IDLE,
      ap: 1,
      mp: 1,
      activeSteps: activeSteps,
      suppressedSteps: 0,
    },
    supply: { isInSupply: true, ticksLastSupply: 0, ticksOutOfSupply: 0 },
    movement: { path: [] },
    combat: { targetHex: null, cooldownEndTick: null },
  } as Unit;
}

function createHex(terrain: TerrainTypes): Hex {
  return {
    _id: new ObjectId(),
    gameId: new ObjectId(),
    unitId: null,
    coords: { q: 0, r: 0, s: 0 },
    terrain: terrain,
    isImpassable: false,
    // supply field omitted for brevity as it's not used in calculator
  } as Hex;
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
      // Calc: (2 * 5 steps) + 2 (Spec Bonus) = 12.
      const unit = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5, [CATALOG_SPEC_ARTILLERY_ID]);
      const power = CombatCalculator.getUnitPower(unit, true);
      expect(power).toBe(12);
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

  describe("calculate (Ratios & Scores)", () => {
    const emptyHex = createHex(TerrainTypes.EMPTY);

    it("should calculate Even odds (1:1) as Score 0", () => {
      // Frigate (10 Power) vs Frigate (10 Power)
      const attacker = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5); // 2*5 = 10
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5); // 2*5 = 10 (Def is same as Att)

      const result = CombatCalculator.calculate(attacker, defender, emptyHex);

      expect(result.attackPower).toBe(10);
      expect(result.defensePower).toBe(10);
      expect(result.oddsRatio).toBe(1);
      expect(result.oddsScore).toBe(0);
      expect(result.finalScore).toBe(0);
    });

    it("should calculate Attacker Advantage (2:1) as Score +1", () => {
      // Battleship (30 Power) vs Frigate (10 Power) -> 3:1 Ratio -> Score +2 (capped at +3 base?)
      // Logic check: ratio >= 1 -> floor(3) - 1 = 2.
      const attacker = createTestUnit(CATALOG_UNIT_BATTLESHIP_ID, 5); // 6*5 = 30
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5); // 2*5 = 10

      const result = CombatCalculator.calculate(attacker, defender, emptyHex);

      expect(result.oddsRatio).toBe(3);
      expect(result.oddsScore).toBe(2); // 3:1 is +2 in this logic
    });

    it("should calculate Defender Advantage (1:2) as Score -1", () => {
      // Frigate (10) vs Battleship (25 Def) -> 0.4 Ratio.
      // Logic check: ratio < 1 -> -floor(25/10) + 1 = -floor(2.5) + 1 = -2 + 1 = -1.
      const attacker = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5); // 10
      const defender = createTestUnit(CATALOG_UNIT_BATTLESHIP_ID, 5); // 5*5 = 25

      const result = CombatCalculator.calculate(attacker, defender, emptyHex);

      expect(result.attackPower).toBe(10);
      expect(result.defensePower).toBe(25);
      expect(result.oddsScore).toBe(-1);
    });
  });

  describe("calculateShifts", () => {
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

    it("should apply Armor Shift (Battleship vs Frigate)", () => {
      const attacker = createTestUnit(CATALOG_UNIT_BATTLESHIP_ID, 5); // Armor 2
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5); // Armor 0
      const emptyHex = createHex(TerrainTypes.EMPTY);

      const result = CombatCalculator.calculate(attacker, defender, emptyHex);

      // Armor Diff = 2. Shift should be +2.
      const armorShift = result.shifts.find(
        (s) => s.type === CombatShiftType.ARMOR
      );
      expect(armorShift).toBeDefined();
      expect(armorShift?.value).toBe(2);
    });

    it("should apply Artillery Shift", () => {
      // Attacker has Artillery Spec (+1 Arty Shift)
      const attacker = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5, [CATALOG_SPEC_ARTILLERY_ID]);
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
      const attacker = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5, [CATALOG_SPEC_MARINES_ID]);
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

    it("should Negate Armor if Defender has Torpedoes", () => {
      const attacker = createTestUnit(CATALOG_UNIT_BATTLESHIP_ID, 5); // Armor 2
      // Defender has Torpedoes
      const defender = createTestUnit(CATALOG_UNIT_FRIGATE_ID, 5, [CATALOG_SPEC_TORPEDO_ID]);
      const emptyHex = createHex(TerrainTypes.EMPTY);

      const result = CombatCalculator.calculate(attacker, defender, emptyHex);

      // Should NOT have Armor shift
      const armorShift = result.shifts.find(
        (s) => s.type === CombatShiftType.ARMOR
      );
      expect(armorShift).toBeUndefined();
    });
  });
});
