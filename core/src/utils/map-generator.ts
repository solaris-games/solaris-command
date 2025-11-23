import { ObjectId } from 'mongodb';
import { HexUtils } from './hex-utils';
import { GameMap as GameMap } from '../models/game-map';
import { Hex, TerrainTypes } from '../models/hex';
import { Planet } from '../models/planet';
import { HexCoords } from '../types/geometry';

interface MapGenOptions {
  radius: number; // Size of the galaxy (e.g., 15 hexes)
  playerCount: number;
  density: 'LOW' | 'MEDIUM' | 'HIGH'; // Affects terrain/planet count
}

export const MapGenerator = {
  generate(gameId: ObjectId, options: MapGenOptions): { 
    map: GameMap, 
    hexes: Hex[], 
    planets: Planet[] 
  } {
    const mapId = new ObjectId();
    const hexes: Hex[] = [];
    const planets: Planet[] = [];

    // 1. Generate the Grid (Spiral out from 0,0,0)
    const coords = HexUtils.getHexesInRange({ q: 0, r: 0, s: 0 }, options.radius);

    // 2. Create Hexes & Terrain
    coords.forEach(coord => {
      const terrain = generateTerrain(coord, options.radius, options.density);
      
      hexes.push({
        _id: new ObjectId(),
        playerId: null,
        gameId: gameId,
        coords: coord,
        terrain: terrain,
        unitId: null,
        supply: { isInSupply: false, ticksLastSupply: 0, ticksOutOfSupply: 0 },
        isImpassable: terrain === TerrainTypes.GRAVITY_WELL || terrain === TerrainTypes.RADIATION_STORM
      });
    });

    // 3. Place Planets
    // A. Place Player Capitals (Balanced spacing)
    const capitalLocs = placeCapitals(options.playerCount, options.radius);
    
    capitalLocs.forEach((loc, index) => {
      planets.push(createPlanet(gameId, loc, `Capital Alpha-${index + 1}`, true));
      
      // Clear terrain at capital
      const hex = hexes.find(h => HexUtils.equals(h.coords, loc));
      if (hex) {
        hex.terrain = TerrainTypes.EMPTY;
        hex.isImpassable = false;
      }
    });

    // B. Place Resource Planets (Random but spaced)
    const resourceCount = Math.floor(hexes.length * getDensityMulti(options.density));
    let placedCount = 0;
    let attempts = 0;

    while (placedCount < resourceCount && attempts < 1000) {
      attempts++;
      const randomHex = hexes[Math.floor(Math.random() * hexes.length)];
      
      // Constraints: Not Impassable, Not near other planets
      if (randomHex.isImpassable) continue;
      if (planets.some(p => HexUtils.distance(p.location, randomHex.coords) < 3)) continue;

      planets.push(createPlanet(gameId, randomHex.coords, `Planet ${placedCount + 1}`, false));
      randomHex.terrain = TerrainTypes.EMPTY; // Clear terrain under planet
      placedCount++;
    }

    // 4. Assemble Map Object
    const map: GameMap = {
      _id: mapId,
      gameId: gameId,
      name: `Sector ${Math.floor(Math.random() * 999)}`,
      radius: options.radius
    };

    return { map, hexes, planets };
  }
};

// --- Helpers ---

function generateTerrain(coord: HexCoords, mapRadius: number, density: string): TerrainTypes {
  const rand = Math.random();
  const dist = HexUtils.distance({q:0,r:0,s:0}, coord);
  
  // Center is always empty (Safe Zone)
  if (dist < 2) return TerrainTypes.EMPTY;

  // Edge is dangerous
  if (dist === mapRadius) return TerrainTypes.RADIATION_STORM;

  // Weights
  let asteroidThresh = 0.1;
  let nebulaThresh = 0.05;
  let debrisThresh = 0.02;

  if (density === 'HIGH') { asteroidThresh = 0.2; nebulaThresh = 0.1; }

  if (rand < debrisThresh) return TerrainTypes.DEBRIS_FIELD;
  if (rand < debrisThresh + asteroidThresh) return TerrainTypes.ASTEROID_FIELD;
  if (rand < debrisThresh + asteroidThresh + nebulaThresh) return TerrainTypes.NEBULA;
  
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

function createPlanet(gameId: ObjectId, loc: HexCoords, name: string, isCapital: boolean): Planet {
  return {
    _id: new ObjectId(),
    gameId: gameId,
    playerId: null, // Unclaimed initially (Controller assigns this later)
    name: name,
    location: loc,
    isCapital: isCapital,
    prestigePointsPerCycle: isCapital ? 100 : 25,
    victoryPointsPerCycle: isCapital ? 10 : 1,
    supply: {
      supplyValue: 100,
      supplyRange: isCapital ? 10 : 5, // Capital has wider range
      isInSupply: true,
      isRoot: isCapital
    }
  };
}

function getDensityMulti(density: string): number {
  switch (density) {
    case 'LOW': return 0.02; // 2% of hexes are planets
    case 'MEDIUM': return 0.04;
    case 'HIGH': return 0.06;
    default: return 0.04;
  }
}