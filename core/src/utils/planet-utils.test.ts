import { describe, it, expect } from "vitest";
import { PlanetUtils } from "./planet-utils";
import { Planet } from "../types/planet";
import { CONSTANTS } from "../data/constants";

describe("PlanetUtils", () => {
  const createPlanet = (
    q: number,
    r: number,
    s: number,
    isCapital: boolean,
  ): Planet =>
    ({
      _id: "p" + Math.random(),
      gameId: "g1",
      playerId: "player1",
      hexId: "h" + Math.random(),
      location: { q, r, s },
      name: "Test Planet",
      isCapital,
      supply: { isRoot: isCapital, range: 10 },
    }) as any;

  describe("calculatePrestigeIncome", () => {
    it("should return base income for capital planets", () => {
      const planets = [createPlanet(0, 0, 0, true)];
      const income = PlanetUtils.calculatePrestigeIncome(planets);
      expect(income).toBe(CONSTANTS.PLANET_PRESTIGE_INCOME_CAPITAL);
    });

    it("should apply penalty for distance from nearest capital", () => {
      const capital = createPlanet(0, 0, 0, true);
      // Distance 1: 5% penalty
      const colony1 = createPlanet(1, 0, -1, false);
      // Distance 2: 10% penalty
      const colony2 = createPlanet(2, 0, -2, false);

      const income1 = PlanetUtils.calculatePrestigeIncome([capital, colony1]);
      // 250 + 100 * (1 - 0.05) = 250 + 95 = 345
      expect(income1).toBe(CONSTANTS.PLANET_PRESTIGE_INCOME_CAPITAL + 95);

      const income2 = PlanetUtils.calculatePrestigeIncome([capital, colony2]);
      // 250 + 100 * (1 - 0.10) = 250 + 90 = 340
      expect(income2).toBe(CONSTANTS.PLANET_PRESTIGE_INCOME_CAPITAL + 90);
    });

    it("should find the NEAREST capital if multiple exist", () => {
      const capital1 = createPlanet(0, 0, 0, true);
      const capital2 = createPlanet(10, 0, -10, true);

      // Near capital 2 (distance 2)
      const colony = createPlanet(8, 0, -8, false);

      const income = PlanetUtils.calculatePrestigeIncome([
        capital1,
        capital2,
        colony,
      ]);
      // 250 + 250 + 100 * (1 - 0.10) = 500 + 90 = 590
      expect(income).toBe(CONSTANTS.PLANET_PRESTIGE_INCOME_CAPITAL * 2 + 90);
    });

    it("should not go below 0", () => {
      const capital = createPlanet(0, 0, 0, true);
      // Distance 21: 105% penalty
      const farColony = createPlanet(21, 0, -21, false);

      const income = PlanetUtils.calculatePrestigeIncome([capital, farColony]);
      // 250 + 0 = 250
      expect(income).toBe(CONSTANTS.PLANET_PRESTIGE_INCOME_CAPITAL);
    });

    it("should handle no capitals (return 0 for colonies)", () => {
      const colony = createPlanet(5, 5, -10, false);
      const income = PlanetUtils.calculatePrestigeIncome([colony]);
      expect(income).toBe(0);
    });
  });

  describe("calculateVPIncome", () => {
    it("should return base income for capitals and colonies", () => {
      const capital = createPlanet(0, 0, 0, true);
      const colony = createPlanet(5, 5, -10, false);

      const income = PlanetUtils.calculateVPIncome([capital, colony]);
      // 3 + 1 = 4
      expect(income).toBe(
        CONSTANTS.PLANET_VP_INCOME_CAPITAL + CONSTANTS.PLANET_VP_INCOME,
      );
    });

    it("should sum multiple planets correctly", () => {
      const planets = [
        createPlanet(0, 0, 0, true),
        createPlanet(1, 1, -2, false),
        createPlanet(2, 2, -4, false),
      ];
      const income = PlanetUtils.calculateVPIncome(planets);
      // 3 + 1 + 1 = 5
      expect(income).toBe(
        CONSTANTS.PLANET_VP_INCOME_CAPITAL + 2 * CONSTANTS.PLANET_VP_INCOME,
      );
    });
  });
});
