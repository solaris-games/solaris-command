import { Planet } from "../types/planet";
import { CONSTANTS } from "../data/constants";
import { HexUtils } from "./hex-utils";

export const PlanetUtils = {
  calculatePlanetPrestigeIncome(planet: Planet, capitals: Planet[]): number {
    if (planet.isCapital) {
      return CONSTANTS.PLANET_PRESTIGE_INCOME_CAPITAL;
    }

    // Find nearest capital
    let minDistance = Infinity;

    for (const capital of capitals) {
      const dist = HexUtils.distance(planet.location, capital.location);

      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    // If no capital exists for this player, they get 0 prestige from colonies
    if (minDistance === Infinity) {
      return 0;
    }

    // % penalty per hex distance
    const penaltyFactor =
      CONSTANTS.PLANET_PRESTIGE_INCOME_HEX_DISTANCE_PENALTY * minDistance;
    const income = Math.max(
      0,
      Math.floor(CONSTANTS.PLANET_PRESTIGE_INCOME * (1 - penaltyFactor)),
    );

    return income;
  },

  /**
   * Calculate total Prestige generated this cycle from a set of owned planets
   */
  calculatePrestigeIncome(ownedPlanets: Planet[]): number {
    const capitals = ownedPlanets.filter((p) => p.isCapital);

    return ownedPlanets.reduce((total, planet) => {
      const income = PlanetUtils.calculatePlanetPrestigeIncome(
        planet,
        capitals,
      );

      return total + income;
    }, 0);
  },

  /**
   * Calculate total VPs generated this cycle from a set of owned planets
   */
  calculateVPIncome(ownedPlanets: Planet[]): number {
    return ownedPlanets.reduce(
      (total, planet) =>
        total +
        (planet.isCapital
          ? CONSTANTS.PLANET_VP_INCOME_CAPITAL
          : CONSTANTS.PLANET_VP_INCOME),
      0,
    );
  },
};
