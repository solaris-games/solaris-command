import { describe, it, expect, vi, beforeEach } from "vitest";
import { TickProcessor } from "./tick-processor";
import { TickContext } from "../types/tick";
import { MockUnifiedId } from "../types/unified-id";
import { Hex, TerrainTypes } from "../types/hex";
import { Unit, UnitStatus, SpecialistStepTypes, UnitStep } from "../types/unit";
import { Player, PlayerStatus } from "../types/player";
import { Planet } from "../types/planet";
import { Station } from "../types/station";
import { Game, GameStates } from "../types/game";
import { HexUtils } from "./hex-utils";
import { SPECIALIST_STEP_ID_MAP } from "../data/specialists";
import { CombatOperation, GameEventTypes } from "../types";

// --- HELPERS ---

const ID_GENERATOR = () => new MockUnifiedId();

function createGame(overrides: Partial<Game> = {}): Game {
  return {
    _id: new MockUnifiedId(),
    mapId: "test-map",
    mapName: "Test Map",
    name: "Test Game",
    description: "Test Description",
    state: {
      status: GameStates.ACTIVE,
      playerCount: 2,
      tick: 1,
      cycle: 1,
      createdDate: new Date(),
      startDate: new Date(),
      endDate: null,
      lastTickDate: new Date(),
      nextTickDate: new Date(),
      nextCycleTickDate: new Date(),
      winnerPlayerId: null,
      ...overrides.state,
    },
    settings: {
      playerCount: 2,
      ticksPerCycle: 20,
      tickDurationMS: 1000,
      victoryPointsToWin: 100,
      combatVersion: "v1",
      movementVersion: "v1",
      ...overrides.settings,
    },
    ...overrides,
  } as Game;
}

function createPlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    _id: new MockUnifiedId(id),
    gameId: new MockUnifiedId(),
    userId: new MockUnifiedId(),
    alias: `Player ${id}`,
    color: "#FFFFFF",
    status: PlayerStatus.ACTIVE,
    prestigePoints: 100,
    victoryPoints: 0,
    renownToDistribute: 0,
    lastSeenDate: new Date(),
    defeatedDate: null,
    isAIControlled: false,
    ...overrides,
  };
}

function createHex(
  q: number,
  r: number,
  s: number,
  overrides: Partial<Hex> = {},
): Hex {
  return {
    _id: new MockUnifiedId(),
    gameId: new MockUnifiedId(),
    playerId: null,
    unitId: null,
    planetId: null,
    stationId: null,
    location: { q, r, s },
    terrain: TerrainTypes.EMPTY,
    zoc: [],
    ...overrides,
  };
}

function createUnit(
  id: string,
  playerId: string,
  hex: Hex,
  overrides: Partial<Unit> = {},
): Unit {
  const steps: UnitStep[] = [
    { isSuppressed: false, specialistId: null },
    { isSuppressed: false, specialistId: null },
    { isSuppressed: false, specialistId: null },
  ];

  return {
    _id: new MockUnifiedId(id),
    gameId: new MockUnifiedId(),
    playerId: new MockUnifiedId(playerId),
    catalogId: "unit_frigate_01", // Assuming this ID exists in catalog
    hexId: hex._id,
    location: hex.location,
    steps,
    state: {
      status: UnitStatus.IDLE,
      ap: 1,
      mp: 4,
      ...overrides.state,
    },
    movement: { path: [] },
    combat: {
      hexId: null,
      location: null,
      operation: null,
      advanceOnVictory: null,
    },
    supply: { isInSupply: true, ticksLastSupply: 0, ticksOutOfSupply: 0 },
    ...overrides,
  };
}

function createPlanet(
  playerId: string | null,
  hex: Hex,
  isCapital: boolean = false,
): Planet {
  return {
    _id: new MockUnifiedId(),
    gameId: new MockUnifiedId(),
    playerId: playerId ? new MockUnifiedId(playerId) : null,
    hexId: hex._id,
    location: hex.location,
    isCapital,
    name: "Test Planet",
    type: "TERRAN",
    resources: [],
    supply: { isRoot: isCapital, range: 10 },
  } as any; // Using as any to skip minor irrelevant props
}

function createStation(playerId: string, hex: Hex): Station {
  return {
    _id: new MockUnifiedId(),
    gameId: new MockUnifiedId(),
    playerId: new MockUnifiedId(playerId),
    hexId: hex._id,
    location: hex.location,
    name: "Test Station",
    level: 1,
  } as any;
}

function createTinyGalaxy() {
  // Flower pattern: 0,0,0 and 6 neighbors
  const center = createHex(0, 0, 0);
  // Use HexUtils.neighbors instead of getNeighbors (typo in original file)
  const neighbors = HexUtils.neighbors(center.location).map((loc) =>
    createHex(loc.q, loc.r, loc.s),
  );
  return [center, ...neighbors];
}

describe("TickProcessor Integration Tests", () => {
  it("should initialize context correctly", () => {
    const game = createGame();
    const players = [createPlayer("p1"), createPlayer("p2")];
    const hexes = createTinyGalaxy();
    const units: Unit[] = [];
    const planets: Planet[] = [];
    const stations: Station[] = [];

    const context = new TickContext(
      game,
      players,
      hexes,
      units,
      planets,
      stations,
      ID_GENERATOR,
    );

    expect(context).toBeDefined();
    expect(context.hexes.length).toBe(7);
  });

  describe("Radiation Storms", () => {
    it("should suppress one step for units in radiation storm hexes", () => {
      const game = createGame();
      const players = [createPlayer("p1")];
      const hexes = createTinyGalaxy();

      // Set center hex to Radiation Storm
      const radiationHex = hexes[0];
      radiationHex.terrain = TerrainTypes.RADIATION_STORM;

      // Place unit in radiation hex
      const unit = createUnit("u1", "p1", radiationHex);
      unit.steps.forEach((s) => (s.isSuppressed = false));
      radiationHex.unitId = unit._id;

      const context = new TickContext(
        game,
        players,
        hexes,
        [unit],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      const suppressedSteps = unit.steps.filter((s) => s.isSuppressed).length;
      expect(suppressedSteps).toBe(1);
    });

    it("should NOT suppress steps for units in EMPTY hexes", () => {
      const game = createGame();
      const players = [createPlayer("p1")];
      const hexes = createTinyGalaxy();

      // Set center hex to EMPTY
      const safeHex = hexes[0];
      safeHex.terrain = TerrainTypes.EMPTY;

      // Place unit
      const unit = createUnit("u1", "p1", safeHex);
      unit.steps.forEach((s) => (s.isSuppressed = false));
      safeHex.unitId = unit._id;

      const context = new TickContext(
        game,
        players,
        hexes,
        [unit],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      const suppressedSteps = unit.steps.filter((s) => s.isSuppressed).length;
      expect(suppressedSteps).toBe(0);
    });
  });

  describe("Territory Capture", () => {
    it("should capture planet when moving onto it", () => {
      const game = createGame();
      const players = [createPlayer("p1"), createPlayer("p2")];
      const hexes = createTinyGalaxy();

      const targetHex = hexes[1];
      // Planet owned by P2
      const planet = createPlanet("p2", targetHex, false);

      const unit = createUnit("u1", "p1", hexes[0]);
      unit.state.status = UnitStatus.MOVING;
      unit.movement.path = [targetHex.location];
      unit.state.mp = 10;
      hexes[0].unitId = unit._id;

      // Pass planets to context
      const context = new TickContext(
        game,
        players,
        hexes,
        [unit],
        [planet],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      // Unit should have moved
      expect(unit.hexId).toEqual(targetHex._id);

      // Planet should be captured
      expect(planet.playerId).toEqual(unit.playerId);
      expect(targetHex.playerId).toEqual(unit.playerId);

      // Event generated
      const event = context.gameEvents.find(
        (e) => e.type === GameEventTypes.PLANET_CAPTURED,
      );
      expect(event).toBeDefined();
    });

    it("should destroy station when moving onto it", () => {
      const game = createGame();
      const players = [createPlayer("p1"), createPlayer("p2")];
      const hexes = createTinyGalaxy();

      const targetHex = hexes[1];
      // Station owned by P2
      const station = createStation("p2", targetHex);
      targetHex.stationId = station._id;

      const unit = createUnit("u1", "p1", hexes[0]);
      unit.state.status = UnitStatus.MOVING;
      unit.movement.path = [targetHex.location];
      unit.state.mp = 10;
      hexes[0].unitId = unit._id;

      // Pass stations to context
      const context = new TickContext(
        game,
        players,
        hexes,
        [unit],
        [],
        [station],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      // Unit moved
      expect(unit.hexId).toEqual(targetHex._id);

      // Station marked for removal
      expect(
        context.stationsToRemove.some(
          (id) => id.toString() === station._id.toString(),
        ),
      ).toBe(true);

      // Event generated
      const event = context.gameEvents.find(
        (e) => e.type === GameEventTypes.PLAYER_DECOMMISSIONED_STATION,
      );
      expect(event).toBeDefined();
    });

    it("should capture adjacent empty hexes via Scout specialist", () => {
      const game = createGame();
      const players = [createPlayer("p1")];
      const hexes = createTinyGalaxy();

      // Center unit with Scouts
      const centerHex = hexes[0];
      const unit = createUnit("u1", "p1", centerHex);

      unit.steps[0].specialistId = "spec_scouts_01";
      unit.steps[0].isSuppressed = false;

      // Destroyers have ZOC in catalog
      unit.catalogId = "unit_destroyer_01";

      centerHex.unitId = unit._id;
      centerHex.playerId = unit.playerId; // Unit owns its hex

      const neighbor = hexes[1];
      neighbor.playerId = null; // Unowned

      const context = new TickContext(
        game,
        players,
        hexes,
        [unit],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      // Neighbor should be captured
      expect(neighbor.playerId).toEqual(unit.playerId);
    });
  });

  describe("Cycle Processing", () => {
    it("should refill Unit AP and MP on cycle tick", () => {
      const game = createGame();
      game.settings.ticksPerCycle = 10;
      game.state.tick = 20; // Exact cycle tick (modulo 0)

      const players = [createPlayer("p1")];
      const hexes = createTinyGalaxy();

      const unit = createUnit("u1", "p1", hexes[0]);
      unit.state.ap = 0;
      unit.state.mp = 0;

      const context = new TickContext(
        game,
        players,
        hexes,
        [unit],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      // Should refill to max (1 AP, 8 MP for Frigate in Catalog)
      expect(unit.state.ap).toBe(1);
      expect(unit.state.mp).toBe(8);
    });

    it("should NOT refill Unit AP and MP on normal tick", () => {
      const game = createGame();
      game.settings.ticksPerCycle = 10;
      game.state.tick = 21; // Not a cycle tick

      const players = [createPlayer("p1")];
      const hexes = createTinyGalaxy();

      const unit = createUnit("u1", "p1", hexes[0]);
      unit.state.ap = 0;
      unit.state.mp = 0;

      const context = new TickContext(
        game,
        players,
        hexes,
        [unit],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      // Should remain empty
      expect(unit.state.ap).toBe(0);
      expect(unit.state.mp).toBe(0);
    });

    it("should award VP and Prestige to players based on owned planets", () => {
      const game = createGame();
      game.settings.ticksPerCycle = 10;
      game.state.tick = 20;

      const player = createPlayer("p1");
      player.prestigePoints = 0;
      player.victoryPoints = 0;

      const hexes = createTinyGalaxy();

      // Player owns 2 planets (one capital, one normal)
      const planet1 = createPlanet(player._id.toString(), hexes[0], true); // Capital
      const planet2 = createPlanet(player._id.toString(), hexes[1], false); // Normal

      const context = new TickContext(
        game,
        [player],
        hexes,
        [],
        [planet1, planet2],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      // Let's not duplicate logic, just check that they have been incremented by some amount.
      expect(player.prestigePoints).toBeGreaterThan(0);
      expect(player.victoryPoints).toBeGreaterThan(0);
    });

    it("should kill units that are out of supply on cycle tick (Collapse)", () => {
      const game = createGame();
      game.settings.ticksPerCycle = 10;
      game.state.tick = 20;

      const player = createPlayer("p1");
      const hexes = createTinyGalaxy();

      const unit = createUnit("u1", "p1", hexes[0]);
      unit.supply.isInSupply = false;

      // 4 cycles OOS is collapse.
      unit.supply.ticksLastSupply = 4 * 10; // 4 cycles

      const context = new TickContext(
        game,
        [player],
        hexes,
        [unit],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      expect(unit.steps.length).toBe(0);

      // Event generated
      const event = context.gameEvents.find(
        (e) => e.type === GameEventTypes.UNIT_STARVED_BY_OOS,
      );
      expect(event).toBeDefined();
    });
  });

  describe("Combat", () => {
    it("should execute basic combat and generate reports", () => {
      const game = createGame();
      const players = [createPlayer("p1"), createPlayer("p2")];
      const hexes = createTinyGalaxy();

      const attackerHex = hexes[0];
      const defenderHex = hexes[1];

      // Attacker
      const attacker = createUnit("attacker", "p1", attackerHex);
      attacker.state.status = UnitStatus.PREPARING;
      attacker.combat.hexId = defenderHex._id;
      attacker.combat.location = defenderHex.location;
      attacker.combat.operation = CombatOperation.STANDARD;
      attacker.combat.advanceOnVictory = false;
      attackerHex.unitId = attacker._id;

      // Defender
      const defender = createUnit("defender", "p2", defenderHex);
      defenderHex.unitId = defender._id;

      const context = new TickContext(
        game,
        players,
        hexes,
        [attacker, defender],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      // Combat should have cleared attacker orders
      expect(attacker.combat.hexId).toBeNull();

      // Check for combat reports in events
      const reports = context.gameEvents.filter(
        (e) => e.type === GameEventTypes.COMBAT_REPORT,
      );
      expect(reports.length).toBe(2); // One for each player

      // Check data integrity
      const reportData = reports[0].data as any;
      expect(reportData.attackerUnitId).toEqual(attacker._id);
      expect(reportData.defenderUnitId).toEqual(defender._id);
    });

    it("should set involved units to REGROUPING and reset others", () => {
      const game = createGame();
      const players = [createPlayer("p1"), createPlayer("p2")];
      const hexes = createTinyGalaxy();

      const attackerHex = hexes[0];
      const defenderHex = hexes[1];

      // Attacker
      const attacker = createUnit("attacker", "p1", attackerHex);
      attacker.state.status = UnitStatus.PREPARING;
      attacker.combat = {
        hexId: defenderHex._id,
        location: defenderHex.location,
        operation: CombatOperation.STANDARD,
        advanceOnVictory: false,
      };
      attackerHex.unitId = attacker._id;

      // Defender
      const defender = createUnit("defender", "p2", defenderHex);
      defenderHex.unitId = defender._id;

      // Bystander (Regrouping from previous tick, should reset to IDLE)
      const bystander = createUnit("bystander", "p1", hexes[2]);
      bystander.state.status = UnitStatus.REGROUPING;

      const context = new TickContext(
        game,
        players,
        hexes,
        [attacker, defender, bystander],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      expect(attacker.state.status).toBe(UnitStatus.REGROUPING);
      expect(defender.state.status).toBe(UnitStatus.REGROUPING);
      expect(bystander.state.status).toBe(UnitStatus.IDLE);
    });

    it("should cancel friendly fire", () => {
      const game = createGame();
      const players = [createPlayer("p1")];
      const hexes = createTinyGalaxy();

      const attackerHex = hexes[0];
      const targetHex = hexes[1];

      // Attacker
      const attacker = createUnit("attacker", "p1", attackerHex);
      attacker.state.status = UnitStatus.PREPARING;
      attacker.combat = {
        hexId: targetHex._id,
        location: targetHex.location,
        operation: CombatOperation.STANDARD,
        advanceOnVictory: false,
      };
      attackerHex.unitId = attacker._id;

      // Target (Same Player)
      const target = createUnit("target", "p1", targetHex);
      targetHex.unitId = target._id;

      const context = new TickContext(
        game,
        players,
        hexes,
        [attacker, target],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      // Should have cancelled event
      const cancelledEvent = context.gameEvents.find(
        (e) => e.type === GameEventTypes.UNIT_COMBAT_ATTACK_CANCELLED,
      );
      expect(cancelledEvent).toBeDefined();

      // Combat cancelled
      expect(attacker.combat.hexId).toBeNull();
      // Attacker set to REGROUPING (penalized for confusion)
      expect(attacker.state.status).toBe(UnitStatus.REGROUPING);
    });
  });

  describe("Player AFK", () => {
    it("should mark active player as AFK if last seen > 24 hours ago", () => {
      const game = createGame();
      // Game started 48 hours ago
      game.state.startDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const player = createPlayer("p1");
      player.status = PlayerStatus.ACTIVE;
      // Player seen 25 hours ago
      player.lastSeenDate = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const hexes = createTinyGalaxy();
      const targetHex = hexes[1];
      const planet = createPlanet("p1", targetHex, false);

      const context = new TickContext(
        game,
        [player],
        [],
        [],
        [planet],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      expect(player.status).toBe(PlayerStatus.AFK);
      expect(player.isAIControlled).toBe(true);
    });

    it("should NOT mark active player as AFK if last seen < 24 hours ago", () => {
      const game = createGame();
      game.state.startDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const player = createPlayer("p1");
      player.status = PlayerStatus.ACTIVE;
      // Player seen 23 hours ago
      player.lastSeenDate = new Date(Date.now() - 23 * 60 * 60 * 1000);

      const hexes = createTinyGalaxy();
      const targetHex = hexes[1];
      const planet = createPlanet("p1", targetHex, false);

      const context = new TickContext(
        game,
        [player],
        [],
        [],
        [planet],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      expect(player.status).toBe(PlayerStatus.ACTIVE);
      expect(player.isAIControlled).toBe(false);
    });

    it("should NOT mark defeated player as AFK", () => {
      const game = createGame();
      game.state.startDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const player = createPlayer("p1");
      player.status = PlayerStatus.DEFEATED;
      player.defeatedDate = new Date();
      player.isAIControlled = true;
      player.lastSeenDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const context = new TickContext(
        game,
        [player],
        [],
        [],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      expect(player.status).toBe(PlayerStatus.DEFEATED);
      expect(player.isAIControlled).toBe(true);
    });
  });

  describe("Player Defeat", () => {
    it("should mark active player as defeated if they do not own any planets or units", () => {
      const game = createGame();
      const player = createPlayer("p1");
      player.status = PlayerStatus.ACTIVE;

      const context = new TickContext(
        game,
        [player],
        [],
        [],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      expect(player.status).toBe(PlayerStatus.DEFEATED);
      expect(player.isAIControlled).toBe(true);
    });

    it("should NOT mark active player as defeated if they own a planet", () => {
      const game = createGame();
      const player = createPlayer("p1");
      player.status = PlayerStatus.ACTIVE;

      const hexes = createTinyGalaxy();
      const targetHex = hexes[1];
      const planet = createPlanet("p1", targetHex, false);

      const context = new TickContext(
        game,
        [player],
        [],
        [],
        [planet],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      expect(player.status).toBe(PlayerStatus.ACTIVE);
      expect(player.isAIControlled).toBe(false);
    });

    it("should NOT mark active player as defeated if they own a unit", () => {
      const game = createGame();
      const player = createPlayer("p1");
      player.status = PlayerStatus.ACTIVE;

      const hexes = createTinyGalaxy();
      const targetHex = hexes[1];
      const unit = createUnit("u1", "p1", targetHex);

      const context = new TickContext(
        game,
        [player],
        [],
        [unit],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      expect(player.status).toBe(PlayerStatus.ACTIVE);
      expect(player.isAIControlled).toBe(false);
    });
  });

  describe("Movement", () => {
    it("should move unit and deduct MP", () => {
      const game = createGame();
      const players = [createPlayer("p1")];
      const hexes = createTinyGalaxy();

      const startHex = hexes[0];
      const targetHex = hexes[1];

      const unit = createUnit("u1", "p1", startHex);
      unit.state.status = UnitStatus.MOVING;
      unit.movement.path = [targetHex.location];
      unit.state.mp = 10;

      startHex.unitId = unit._id;

      const context = new TickContext(
        game,
        players,
        hexes,
        [unit],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      // Should have moved
      expect(unit.location).toEqual(targetHex.location);
      expect(unit.hexId).toEqual(targetHex._id);
      expect(unit.state.status).toBe(UnitStatus.IDLE);
      expect(unit.movement.path.length).toBe(0);

      // Should have deducted cost (1 MP for Empty hex)
      expect(unit.state.mp).toBe(9);

      // Hex Update
      expect(startHex.unitId).toBeNull();
      expect(targetHex.unitId).toEqual(unit._id);
    });

    it("should bounce unit if target hex is occupied", () => {
      const game = createGame();
      const players = [createPlayer("p1"), createPlayer("p2")];
      const hexes = createTinyGalaxy();

      const startHex = hexes[0];
      const targetHex = hexes[1];

      // Mover
      const unit1 = createUnit("u1", "p1", startHex);
      unit1.state.status = UnitStatus.MOVING;
      unit1.movement.path = [targetHex.location];
      unit1.state.mp = 10;
      startHex.unitId = unit1._id;

      // Blocker (Enemy)
      const unit2 = createUnit("u2", "p2", targetHex);
      targetHex.unitId = unit2._id;

      const context = new TickContext(
        game,
        players,
        hexes,
        [unit1, unit2],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      // Unit 1 should stay put
      expect(unit1.location).toEqual(startHex.location);
      expect(unit1.hexId).toEqual(startHex._id);

      // Note: The logic for bouncing sets the unit to REGROUPING at the end of the tick
      // because it adds it to postTickRegroupingUnits.
      expect(unit1.state.status).toBe(UnitStatus.REGROUPING);

      expect(unit1.movement.path.length).toBe(0);
      expect(unit1.state.mp).toBe(9); // Deducted cost even on bounce

      // Should be suppressed
      const suppressedSteps = unit1.steps.filter((s) => s.isSuppressed).length;
      expect(suppressedSteps).toBe(1);

      // Should be regrouping (bounced units are disorganised)
      expect(unit1.state.status).toBe(UnitStatus.REGROUPING);
    });

    it("should not bounce unit if target hex is occupied and target hex's unit is moving", () => {
      const game = createGame();
      const players = [createPlayer("p1"), createPlayer("p2")];
      const hexes = createTinyGalaxy();

      const startHex = hexes[0];
      const targetHexUnit1 = hexes[1];
      const targetHexUnit2 = hexes[2];

      // Mover
      const unit1 = createUnit("u1", "p1", startHex);
      unit1.state.status = UnitStatus.MOVING;
      unit1.movement.path = [targetHexUnit1.location];
      unit1.state.mp = 10;
      startHex.unitId = unit1._id;

      // Moving blocker (Enemy)
      const unit2 = createUnit("u2", "p2", targetHexUnit1);
      unit2.state.status = UnitStatus.MOVING;
      unit2.movement.path = [targetHexUnit2.location];
      unit2.state.mp = 10;
      targetHexUnit1.unitId = unit2._id;

      const context = new TickContext(
        game,
        players,
        hexes,
        [unit1, unit2],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      // Should have moved
      expect(unit1.location).toEqual(targetHexUnit1.location);
      expect(unit1.hexId).toEqual(targetHexUnit1._id);
      expect(unit1.state.status).toBe(UnitStatus.IDLE);
      expect(unit1.movement.path.length).toBe(0);

      // Should have deducted cost (1 MP for Empty hex)
      expect(unit1.state.mp).toBe(9);

      // Hex Update
      expect(startHex.unitId).toBeNull();
      expect(targetHexUnit1.unitId).toEqual(unit1._id);
    });

    it("should resolve race condition: 2 units -> 1 hex (Initiative Check)", () => {
      const game = createGame();
      const players = [createPlayer("p1"), createPlayer("p2")];
      const hexes = createTinyGalaxy();

      const targetHex = hexes[0];
      const startHex1 = hexes[1];
      const startHex2 = hexes[2];

      // Setup uses "unit_frigate_01" which has high initiative
      const unit1 = createUnit("u1", "p1", startHex1);
      unit1.state.status = UnitStatus.MOVING;
      unit1.movement.path = [targetHex.location];
      unit1.state.mp = 10;

      // Let's use steps to differentiate since both are frigates.
      // Unit 1: 3 steps
      const unit2 = createUnit("u2", "p2", startHex2);
      unit2.state.status = UnitStatus.MOVING;
      unit2.movement.path = [targetHex.location];
      unit2.state.mp = 10;
      // Unit 2: 2 steps (less than unit 1)
      unit2.steps.pop();

      startHex1.unitId = unit1._id;
      startHex2.unitId = unit2._id;

      const context = new TickContext(
        game,
        players,
        hexes,
        [unit1, unit2],
        [],
        [],
        ID_GENERATOR,
      );

      TickProcessor.processTick(context);

      // Logic: Tie-break: Active steps (Highest wins).
      // Unit 1 has 3, Unit 2 has 2. Unit 1 should win.

      // Unit 1 Moves
      expect(unit1.location).toEqual(targetHex.location);
      expect(unit1.hexId).toEqual(targetHex._id);
      expect(targetHex.unitId).toEqual(unit1._id);

      // Unit 2 Bounces
      expect(unit2.location).toEqual(startHex2.location);
      expect(unit2.state.status).toBe(UnitStatus.REGROUPING);
      expect(unit2.steps.filter((s) => s.isSuppressed).length).toBe(1);
    });
  });
});
