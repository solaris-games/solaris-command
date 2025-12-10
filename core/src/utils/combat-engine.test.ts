import { describe, it, expect, vi, beforeEach } from "vitest";
import { CombatEngine } from "./combat-engine";
import { Unit, UnitStatus, Hex, TerrainTypes, UnitStep } from "../models";
import {
  CombatOperation,
  CombatResultType,
  CombatForcedResult,
  SpecialistStepTypes,
} from "../types";
import { CombatCalculator } from "./combat-calculator";
import { CombatTables, SPECIALIST_STEP_MAP } from "../data";
import { UnitManagerHelper as UnitUtils } from "./unit-manager";
import { ObjectId } from "mongodb";
import { HexUtils } from "./hex-utils";

// --- MOCKS ---
vi.mock("./combat-calculator");
vi.mock("../data");
vi.mock("./unit-manager");

// --- FACTORIES ---
function createHex(
  q: number,
  r: number,
  s: number,
  unitId: ObjectId | null,
  terrain: TerrainTypes = TerrainTypes.EMPTY
): Hex {
  return {
    _id: new ObjectId(),
    gameId: new ObjectId(),
    unitId,
    playerId: null,
    location: { q, r, s },
    terrain: terrain,
  };
}

function createUnit(
  id: string,
  playerId: string,
  q: number,
  r: number,
  s: number,
  status = UnitStatus.IDLE,
  mp: number = 1
): Unit {
  return {
    _id: new ObjectId(id),
    gameId: new ObjectId(),
    playerId: new ObjectId(playerId),
    catalogId: "unit_frigate_01",
    location: { q, r, s },
    steps: [
      { isSuppressed: false, specialistId: null },
      { isSuppressed: false, specialistId: null },
      { isSuppressed: false, specialistId: null },
      { isSuppressed: false, specialistId: null },
      { isSuppressed: false, specialistId: null },
    ],
    state: {
      status,
      ap: 1,
      mp: mp
    },
    movement: { path: [] },
    combat: { hexId: null },
    supply: { isInSupply: true, ticksLastSupply: 0, ticksOutOfSupply: 0 },
  } as any;
}

describe("CombatEngine", () => {
  const attackerId = new ObjectId().toString();
  const defenderId = new ObjectId().toString();
  let attacker: Unit;
  let defender: Unit;
  let hexLookup: Map<string, Hex>;
  let combatHex: Hex;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup basic scenario: Attacker at 0,0,0 vs Defender at 1,0,-1
    attacker = createUnit(attackerId, new ObjectId().toString(), 0, 0, 0, UnitStatus.PREPARING);
    defender = createUnit(defenderId, new ObjectId().toString(), 1, 0, -1, UnitStatus.IDLE);

    combatHex = createHex(1, 0, -1, defender._id); // Where defender is
    const startHex = createHex(0, 0, 0, attacker._id);

    hexLookup = new Map();
    hexLookup.set(HexUtils.getCoordsID(combatHex.location), combatHex);
    hexLookup.set(HexUtils.getCoordsID(startHex.location), startHex);

    // Mock Unit Utils to simulate damage application (simple pass-through or modification)
    // We mock them to return modified arrays so we can check calls
    vi.mocked(UnitUtils.suppressSteps).mockImplementation((steps, count) => {
      // Simple mock logic: just flag 'count' steps as suppressed for the test return
      return steps.map((s, i) =>
        i < count ? { ...s, isSuppressed: true } : s
      );
    });
    vi.mocked(UnitUtils.killSteps).mockImplementation((steps, count) => {
      return steps.slice(count);
    });
  });

  describe("resolveBattle", () => {
    it("should use forcedResult from calculator if present (e.g. Feint)", () => {
      // Mock Calculator to return a forced result
      const forcedResult: CombatForcedResult = {
        attacker: { steps: 0, suppressed: 1 },
        defender: { steps: 0, suppressed: 1, retreat: false, shattered: false },
        resultType: CombatResultType.SUPPRESS,
      };

      vi.mocked(CombatCalculator.calculate).mockReturnValue({
        attackPower: 10,
        defensePower: 10,
        oddsRatio: 1,
        oddsScore: 0,
        shifts: [],
        finalScore: 0,
        forcedResult: forcedResult, // <--- KEY
      });

      const result = CombatEngine.resolveBattle(
        attacker,
        defender,
        hexLookup,
        CombatOperation.FEINT,
        true
      );

      // Verify Calculator was called with correct operation
      expect(CombatCalculator.calculate).toHaveBeenCalledWith(
        attacker,
        defender,
        combatHex,
        CombatOperation.FEINT
      );

      // Verify CombatTables was NOT called (Optimization check)
      expect(CombatTables.getResult).not.toHaveBeenCalled();

      // Verify Damage Application based on forced result
      expect(UnitUtils.suppressSteps).toHaveBeenCalledWith(
        expect.anything(),
        1
      ); // Attacker
      expect(UnitUtils.suppressSteps).toHaveBeenCalledWith(
        expect.anything(),
        1
      ); // Defender
    });

    it("should use CombatTables result if no forcedResult (Standard Attack)", () => {
      // Mock Calculator (Standard)
      vi.mocked(CombatCalculator.calculate).mockReturnValue({
        attackPower: 20,
        defensePower: 10,
        oddsRatio: 2,
        oddsScore: 2,
        shifts: [],
        finalScore: 2,
        forcedResult: null,
      });

      // Mock Table Result
      const tableResult: CombatForcedResult = {
        attacker: { steps: 0, suppressed: 0 },
        defender: { steps: 1, suppressed: 1, retreat: false, shattered: false },
        resultType: CombatResultType.SUPPRESS,
      };
      vi.mocked(CombatTables.getResult).mockReturnValue(tableResult);

      const result = CombatEngine.resolveBattle(
        attacker,
        defender,
        hexLookup,
        CombatOperation.STANDARD,
        true
      );

      // Verify Table Lookup
      expect(CombatTables.getResult).toHaveBeenCalledWith(2);

      // Verify Damage
      expect(UnitUtils.killSteps).toHaveBeenCalledWith(expect.anything(), 1); // Defender loses 1 step
    });

    it("should kill and suppress steps based on combat table result (Standard Attack)", () => {
      // Mock Calculator (Standard)
      vi.mocked(CombatCalculator.calculate).mockReturnValue({
        attackPower: 20,
        defensePower: 10,
        oddsRatio: 2,
        oddsScore: 2,
        shifts: [],
        finalScore: 2,
        forcedResult: null,
      });

      // Mock Table Result
      const tableResult: CombatForcedResult = {
        attacker: { steps: 1, suppressed: 2 },
        defender: { steps: 3, suppressed: 4, retreat: false, shattered: false },
        resultType: CombatResultType.SUPPRESS,
      };
      vi.mocked(CombatTables.getResult).mockReturnValue(tableResult);

      const result = CombatEngine.resolveBattle(
        attacker,
        defender,
        hexLookup,
        CombatOperation.STANDARD,
        true
      );

      // Verify Table Lookup
      expect(CombatTables.getResult).toHaveBeenCalledWith(2);

      // Verify Damage
      expect(UnitUtils.killSteps).toHaveBeenCalledWith(expect.anything(), 1);
      expect(UnitUtils.suppressSteps).toHaveBeenCalledWith(expect.anything(), 2);
      expect(UnitUtils.killSteps).toHaveBeenCalledWith(expect.anything(), 3);
      expect(UnitUtils.suppressSteps).toHaveBeenCalledWith(expect.anything(), 4);
    });

    it("should handle Retreat logic", () => {
      // Mock Result: Retreat
      const retreatResult: CombatForcedResult = {
        attacker: { steps: 0, suppressed: 0 },
        defender: { steps: 0, suppressed: 1, retreat: true, shattered: false },
        resultType: CombatResultType.RETREAT,
      };

      vi.mocked(CombatCalculator.calculate).mockReturnValue({
        attackPower: 10,
        defensePower: 10,
        oddsRatio: 1,
        oddsScore: 0,
        shifts: [],
        finalScore: 0,
        forcedResult: retreatResult,
      });

      // Create a valid retreat hex
      const retreatHex = createHex(2, 0, -2, null); // Adjacent to defender (1, 0, -1)
      hexLookup.set(HexUtils.getCoordsID(retreatHex.location), retreatHex);

      // Spy on findRetreatHex logic (implicit in resolveBattle, but we check outcome)
      const result = CombatEngine.resolveBattle(
        attacker,
        defender,
        hexLookup,
        CombatOperation.STANDARD,
        false
      );

      expect(result.report.defender.retreated).toBe(true);
      expect(result.report.defender.shattered).toBe(false);
      // Defender should move
      expect(defender.location).toEqual(retreatHex.location);
      expect(defender.state.status).toBe(UnitStatus.REGROUPING);
    });

    it("should Shatter defender if they cannot retreat", () => {
      // Mock Result: Retreat required
      const retreatResult: CombatForcedResult = {
        attacker: { steps: 0, suppressed: 0 },
        defender: { steps: 0, suppressed: 0, retreat: true, shattered: false },
        resultType: CombatResultType.RETREAT,
      };

      vi.mocked(CombatCalculator.calculate).mockReturnValue({
        attackPower: 10,
        defensePower: 10,
        oddsRatio: 1,
        oddsScore: 0,
        shifts: [],
        finalScore: 0,
        forcedResult: retreatResult,
      });

      // No valid retreat hexes (surrounded or map edge)
      // We accomplish this by NOT adding neighbors to hexLookup

      const result = CombatEngine.resolveBattle(
        attacker,
        defender,
        hexLookup, // Only contains combat hex and attacker hex
        CombatOperation.STANDARD,
        false
      );

      expect(result.report.defender.retreated).toBe(false);
      expect(result.report.defender.shattered).toBe(true);

      // Should apply massive suppression
      expect(UnitUtils.suppressSteps).toHaveBeenCalledWith(
        expect.anything(),
        999
      );
    });

    it("should Advance on Victory if enabled and defender moved", () => {
      // Mock Result: Retreat
      const retreatResult: CombatForcedResult = {
        attacker: { steps: 0, suppressed: 0 },
        defender: { steps: 0, suppressed: 0, retreat: true, shattered: false },
        resultType: CombatResultType.RETREAT,
      };
      vi.mocked(CombatCalculator.calculate).mockReturnValue({
        attackPower: 10,
        defensePower: 10,
        oddsRatio: 1,
        oddsScore: 0,
        shifts: [],
        finalScore: 0,
        forcedResult: retreatResult,
      });

      // Valid retreat hex
      const retreatHex = createHex(2, 0, -2, null);
      hexLookup.set(HexUtils.getCoordsID(retreatHex.location), retreatHex);

      const result = CombatEngine.resolveBattle(
        attacker,
        defender,
        hexLookup,
        CombatOperation.STANDARD,
        true
      );

      expect(result.attackerWonHex).toBe(true);
      // Attacker should now be in defender's old spot
      expect(attacker.location).toEqual(combatHex.location);
    });

    it("should throw error for SUPPRESSIVE_FIRE without Artillery", () => {
      attacker.steps = [
        { isSuppressed: false, specialistId: null },
        { isSuppressed: false, specialistId: null },
        { isSuppressed: false, specialistId: null },
      ];

      vi.mocked(UnitUtils.unitHasActiveSpecialistStep).mockImplementation(() => {
        return false;
      });

      expect(() => {
        CombatEngine.resolveBattle(
          attacker,
          defender,
          hexLookup,
          CombatOperation.SUPPRESSIVE_FIRE,
          false
        );
      }).toThrow();
    });

    it("should NOT Advance on Victory if operation is Suppressive Fire", () => {
      // Suppressive Fire usually forces a result, but even if it killed them
      // the attacker shouldn't move.
      const killResult: CombatForcedResult = {
        attacker: { steps: 0, suppressed: 0 },
        defender: { steps: 5, suppressed: 0, retreat: false, shattered: false },
        resultType: CombatResultType.SHATTERED,
      };

      vi.mocked(CombatCalculator.calculate).mockReturnValue({
        attackPower: 10,
        defensePower: 10,
        oddsRatio: 1,
        oddsScore: 0,
        shifts: [],
        finalScore: 0,
        forcedResult: killResult,
      });

      attacker.steps[0].specialistId = SPECIALIST_STEP_MAP.get(
        SpecialistStepTypes.ARTILLERY
      )!.id;

      vi.mocked(UnitUtils.unitHasActiveSpecialistStep).mockImplementation(() => {
        return true;
      });

      const result = CombatEngine.resolveBattle(
        attacker,
        defender,
        hexLookup,
        CombatOperation.SUPPRESSIVE_FIRE,
        true // Even if user wanted it
      );

      expect(result.attackerWonHex).toBe(false);
      expect(attacker.location).not.toEqual(combatHex.location);
    });

    it("should suppress the first specialist step if operation is Suppressive Fire", () => {
      // Suppressive Fire usually forces a result, but even if it killed them
      // the attacker shouldn't move.
      const killResult: CombatForcedResult = {
        attacker: { steps: 0, suppressed: 0 },
        defender: { steps: 5, suppressed: 0, retreat: false, shattered: false },
        resultType: CombatResultType.SHATTERED,
      };

      vi.mocked(CombatCalculator.calculate).mockReturnValue({
        attackPower: 10,
        defensePower: 10,
        oddsRatio: 1,
        oddsScore: 0,
        shifts: [],
        finalScore: 0,
        forcedResult: killResult,
      });

      attacker.steps[0].specialistId = SPECIALIST_STEP_MAP.get(
        SpecialistStepTypes.ARTILLERY
      )!.id;
      attacker.steps[1].specialistId = SPECIALIST_STEP_MAP.get(
        SpecialistStepTypes.ARTILLERY
      )!.id;

      vi.mocked(UnitUtils.unitHasActiveSpecialistStep).mockImplementation(() => {
        return true;
      });

      CombatEngine.resolveBattle(
        attacker,
        defender,
        hexLookup,
        CombatOperation.SUPPRESSIVE_FIRE,
        false
      );

      expect(attacker.steps[0].isSuppressed).toBe(true);
      expect(attacker.steps[1].isSuppressed).toBe(false);
    });
  });

  describe("findRetreatHex", () => {
    it("should pick the lowest movement cost hex", () => {
      // Setup: Defender at 1,0,-1
      // Neighbor 1: Asteroid (Cost 2) at 2,0,-2
      // Neighbor 2: Empty (Cost 1) at 1,1,-2

      const asteroidHex = createHex(2, 0, -2, null, TerrainTypes.ASTEROID_FIELD);
      const emptyHex = createHex(1, 1, -2, null, TerrainTypes.EMPTY);

      hexLookup.set(HexUtils.getCoordsID(asteroidHex.location), asteroidHex);
      hexLookup.set(HexUtils.getCoordsID(emptyHex.location), emptyHex);

      const retreatHex = CombatEngine.findRetreatHex(
        defender,
        attacker,
        hexLookup
      );

      expect(retreatHex).toBeDefined();
      expect(retreatHex?.location).toEqual(emptyHex.location);
    });

    it("should NOT retreat into the attacker", () => {
      // Only valid neighbor is where the attacker is coming from
      // Attacker is at 0,0,0

      // (In this test setup, we didn't add any other neighbors to hexLookup)

      const retreatHex = CombatEngine.findRetreatHex(
        defender,
        attacker,
        hexLookup
      );

      expect(retreatHex).toBeNull();
    });
  });
});
