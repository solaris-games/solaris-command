import { describe, it, expect } from "vitest";
import { UnitFactory } from "./unit-factory";
import { UnitStatus } from "../models/unit";
import { UNIT_CATALOG_ID_MAP } from "../data/units";
import { MockUnifiedId } from "../types";

describe("UnitFactory", () => {
  it("should create a unit with correct structure", () => {
    const playerId = new MockUnifiedId();
    const gameId = new MockUnifiedId();
    const hexId = new MockUnifiedId();
    const coords = { q: 0, r: 0, s: 0 };
    const catalogId = "unit_corvette_01";
    const catalogItem = UNIT_CATALOG_ID_MAP.get(catalogId)!;

    const unit = UnitFactory.createUnit(
      catalogId,
      playerId,
      gameId,
      hexId,
      coords,
      () => new MockUnifiedId()
    );

    expect(unit).toBeDefined();
    expect(unit.playerId.toString()).toBe(playerId.toString());
    expect(unit.gameId.toString()).toBe(gameId.toString());
    expect(unit.catalogId).toBe(catalogId);
    expect(unit.location).toEqual(coords);

    // Steps
    expect(unit.steps).toHaveLength(catalogItem.stats.defaultSteps);
    expect(unit.steps[0]).toEqual({ isSuppressed: false, specialistId: null });

    // State
    expect(unit.state.status).toBe(UnitStatus.IDLE);
    expect(unit.state.ap).toBe(catalogItem.stats.maxAP);
    expect(unit.state.mp).toBe(catalogItem.stats.maxMP);

    // Sub-objects
    expect(unit.movement.path).toEqual([]);
    expect(unit.combat.hexId).toBeNull();
    expect(unit.combat.location).toBeNull();
    expect(unit.supply.isInSupply).toBe(true);
    expect(unit.supply.ticksLastSupply).toBe(0);
    expect(unit.supply.ticksOutOfSupply).toBe(0);
  });

  it("should throw error for invalid catalog ID", () => {
    expect(() => {
      UnitFactory.createUnit(
        "invalid_id",
        new MockUnifiedId(),
        new MockUnifiedId(),
        new MockUnifiedId(),
        { q: 0, r: 0, s: 0 },
        () => new MockUnifiedId()
      );
    }).toThrow();
  });
});
