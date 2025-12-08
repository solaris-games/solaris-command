import { describe, it, expect } from "vitest";
import { ObjectId } from "mongodb";
import { UnitFactory } from "./unit-factory";
import { UnitStatus } from "../models/unit";
import { UNIT_CATALOG_ID_MAP } from "../data/units";

describe("UnitFactory", () => {
    it("should create a unit with correct structure", () => {
        const playerId = new ObjectId();
        const gameId = new ObjectId();
        const coords = { q: 0, r: 0, s: 0 };
        const catalogId = "unit_corvette_01";
        const catalogItem = UNIT_CATALOG_ID_MAP.get(catalogId)!;

        const unit = UnitFactory.createUnit(catalogId, playerId, gameId, coords);

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
        expect(unit.state.activeSteps).toBe(catalogItem.stats.defaultSteps);
        expect(unit.state.suppressedSteps).toBe(0);
        expect(unit.state.ap).toBe(catalogItem.stats.maxAP);
        expect(unit.state.mp).toBe(catalogItem.stats.maxMP);

        // Sub-objects
        expect(unit.movement.path).toEqual([]);
        expect(unit.combat.hexId).toBeNull();
        expect(unit.supply.isCutOff).toBe(false);
    });

    it("should throw error for invalid catalog ID", () => {
        expect(() => {
            UnitFactory.createUnit("invalid_id", new ObjectId(), new ObjectId(), { q:0, r:0, s:0 });
        }).toThrow();
    });
});
