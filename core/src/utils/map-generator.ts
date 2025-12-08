import { ObjectId } from "mongodb";
import { HexUtils } from "./hex-utils";
import { Hex, TerrainTypes, Planet } from "../models";
import { HexCoords } from "../types";
import { MapUtils } from "./map-utils";
import {  PLANET_NAMES } from "../data";

interface MapGenOptions {
  radius: number; // Size of the galaxy (e.g., 15 hexes)
  playerCount: number;
  density: "LOW" | "MEDIUM" | "HIGH"; // Affects terrain/planet count
}

export const MapGenerator = {
  generate(
    gameId: ObjectId,
    options: MapGenOptions
  ): {
    hexes: Hex[];
    planets: Planet[];
  } {
    const hexes: Hex[] = [];
    const planets: Planet[] = [];
    const planetNames = PLANET_NAMES.slice();

    // 1. Generate the Grid (Spiral out from 0,0,0)
    const coords = HexUtils.getHexCoordsInRange(
      { q: 0, r: 0, s: 0 },
      options.radius
    );

    // 2. Create Hexes & Terrain
    coords.forEach((coord) => {
      const terrain = generateTerrain(coord, options.radius, options.density);

      hexes.push({
        _id: new ObjectId(),
        playerId: null,
        gameId: gameId,
        coords: coord,
        terrain: terrain,
        unitId: null,
        supply: { isInSupply: false, ticksLastSupply: 0, ticksOutOfSupply: 0 },
      });
    });

    // 3. Place Planets
    // A. Place Player Capitals (Balanced spacing)
    const capitalLocs = placeCapitals(options.playerCount, options.radius);

    capitalLocs.forEach((loc) => {
      const planetName = planetNames.splice(Math.floor(Math.random() * PLANET_NAMES.length), 1)[0]

      planets.push(createPlanet(gameId, loc, planetName, true));

      // Clear terrain at capital
      const hex = hexes.find((h) => HexUtils.equals(h.coords, loc));
      if (hex) {
        hex.terrain = TerrainTypes.EMPTY;
      }
    });

    // B. Place Resource Planets (Random but spaced)
    const resourceCount = Math.floor(
      hexes.length * getDensityMulti(options.density)
    );
    let placedCount = 0;
    let attempts = 0;

    while (placedCount < resourceCount && attempts < 1000) {
      attempts++;
      const randomHex = hexes[Math.floor(Math.random() * hexes.length)];

      // Constraints: Not Impassable, Not near other planets
      if (MapUtils.isHexImpassable(randomHex)) continue;
      if (
        planets.some((p) => HexUtils.distance(p.location, randomHex.coords) < 3)
      )
        continue;

      const planetName = planetNames.splice(Math.floor(Math.random() * PLANET_NAMES.length), 1)[0]

      planets.push(
        createPlanet(
          gameId,
          randomHex.coords,
          planetName,
          false
        )
      );
      randomHex.terrain = TerrainTypes.EMPTY; // Clear terrain under planet
      placedCount++;
    }

    return { hexes, planets };
  },
};

// --- Helpers ---

function generateTerrain(
  coord: HexCoords,
  mapRadius: number,
  density: string
): TerrainTypes {
  const rand = Math.random();
  const dist = HexUtils.distance({ q: 0, r: 0, s: 0 }, coord);

  // Center is always empty (Safe Zone)
  if (dist < 2) return TerrainTypes.EMPTY;

  // Edge is dangerous
  if (dist === mapRadius) return TerrainTypes.RADIATION_STORM;

  // Weights
  let asteroidThresh = 0.1;
  let nebulaThresh = 0.05;
  let debrisThresh = 0.02;

  if (density === "HIGH") {
    asteroidThresh = 0.2;
    nebulaThresh = 0.1;
  }

  if (rand < debrisThresh) return TerrainTypes.DEBRIS_FIELD;
  if (rand < debrisThresh + asteroidThresh) return TerrainTypes.ASTEROID_FIELD;
  if (rand < debrisThresh + asteroidThresh + nebulaThresh)
    return TerrainTypes.NEBULA;

  return TerrainTypes.EMPTY;
}

function placeCapitals(count: number, radius: number): HexCoords[] {
  // Simple approach: Place them in a ring at 75% radius
  const ringRadius = Math.floor(radius * 0.75);
  const capitals: HexCoords[] = [];

  if (count === 2) {
    // Opposites
    capitals.push(HexUtils.scale(HexUtils.direction(0), ringRadius));
    capitals.push(HexUtils.scale(HexUtils.direction(3), ringRadius));
  } else {
    // Distribute along the 6 directions
    // Note: Ideally we rotate around the circle, but using the 6 axes is easier for MVP
    for (let i = 0; i < count; i++) {
      const dirIndex = Math.floor((i / count) * 6);
      capitals.push(HexUtils.scale(HexUtils.direction(dirIndex), ringRadius));
    }
  }
  return capitals;
}

function createPlanet(
  gameId: ObjectId,
  loc: HexCoords,
  name: string,
  isCapital: boolean
): Planet {
  return {
    _id: new ObjectId(),
    gameId: gameId,
    playerId: null, // Unclaimed initially (Controller assigns this later)
    name: name,
    location: loc,
    isCapital: isCapital,
    supply: {
      isInSupply: true,
      isRoot: isCapital,
    },
  };
}

function getDensityMulti(density: string): number {
  switch (density) {
    case "LOW":
      return 0.02; // 2% of hexes are planets
    case "MEDIUM":
      return 0.04;
    case "HIGH":
      return 0.06;
    default:
      return 0.04;
  }
}
