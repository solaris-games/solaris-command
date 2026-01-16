import { GameStates } from "../game";
import { TerrainTypes } from "../hex";
import { HexCoords } from "../geometry";
import { SupplySource, SupplyTarget } from "../supply";
import { CombatOperation } from "../combat";
import { UnifiedId } from "../unified-id";
import { Player, PlayerStatus } from "../player";
import { Unit, UnitStatus } from "../unit";
import { Station } from "../station";

// Users
export interface UserDetailsResponseSchema {
  _id: string;
  username: string;
  email: string;
  lastSeenDate: string;
  achievements: {
    victories: number;
    rank: number;
    renown: number;
  };
}

// Auth
export interface LoginResponseSchema {
  token: string;
  user: UserDetailsResponseSchema;
}

// Games
export interface GameListItemResponseSchema {
  _id: string;
  name: string;
  description: string;
  state: {
    status: GameStates;
    playerCount: number;
    tick: number;
    cycle: number;
  };
  settings: {
    playerCount: number;
  };
  userHasJoined: boolean;
}

// Galaxy Structure
// Derived from server/src/services/GalaxyService.ts
export interface GameGalaxyResponseSchema {
  game: {
    _id: UnifiedId;
    mapId: string;
    name: string;
    description: string;
    state: {
      status: GameStates;
      playerCount: number;
      tick: number;
      cycle: number;
      createdDate: string;
      startDate: string | null;
      endDate: string | null;
      lastTickDate: string | null;
      winnerPlayerId: string | null;
    };
    settings: {
      playerCount: number;
      ticksPerCycle: number;
      tickDurationMS: number;
      victoryPointsToWin: number;
    };
  };
  players: {
    _id: UnifiedId;
    gameId: UnifiedId;
    userId: UnifiedId | null;
    alias: string;
    color: string;
    status: PlayerStatus;
    prestigePoints: number | null;
    victoryPoints: number | null;
    lastSeenDate: string;
    renownToDistribute: number | null;
    isAIControlled: boolean;
  }[];
  hexes: {
    _id: UnifiedId;
    gameId: UnifiedId;
    planetId: UnifiedId | null;
    stationId: UnifiedId | null;
    unitId: UnifiedId | null;
    playerId: UnifiedId | null;
    location: HexCoords;
    terrain: TerrainTypes;
    zoc: {
      playerId: string;
      unitId: string;
    }[];
  }[];
  planets: {
    _id: UnifiedId;
    gameId: UnifiedId;
    playerId: UnifiedId | null;
    hexId: UnifiedId;
    location: HexCoords;
    name: string;
    isCapital: boolean;
    supply: SupplySource;
  }[];
  stations: {
    _id: UnifiedId;
    gameId: UnifiedId;
    playerId: UnifiedId;
    hexId: UnifiedId;
    location: HexCoords;
    supply: SupplySource;
  }[];
  units: {
    _id: UnifiedId;
    playerId: UnifiedId;
    catalogId: string;
    hexId: UnifiedId;
    location: HexCoords;
    steps: {
      isSuppressed: boolean;
      specialistId: string | null;
    }[];
    state: {
      status: UnitStatus;
      ap: number;
      mp: number;
      activeSteps: number;
      suppressedSteps: number;
    };
    movement: {
      path: HexCoords[];
    };
    combat: {
      hexId: UnifiedId | null,
      location: HexCoords | null;
      operation: CombatOperation | null;
      advanceOnVictory: boolean | null;
    };
    supply: SupplyTarget;
  }[];
}

export interface JoinGameResponseSchema {
  player: Player; // Safe to use full model
}

export interface GameEventsResponseSchema {
  _id: string;
  gameId: string;
  playerId: string | null;
  tick: number;
  type: string;
  data: object;
}

// Units
export interface DeployUnitResponseSchema {
  unit: Unit; // Safe to use full model
}

// Stations
export interface BuildStationResponseSchema {
  station: Station; // Safe to use full model
  prestigeCost: number;
}
