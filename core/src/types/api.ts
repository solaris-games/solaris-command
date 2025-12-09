import { Game, GameState, GameSettings } from "../models/game";
import { User } from "../models/user";
import { Unit } from "../models/unit";
import { Station } from "../models/station";
import { Player } from "../models/player";
import { Hex } from "../models/hex";
import { Planet } from "../models/planet";

// Auth
export interface LoginResponse {
  token: string;
  user: User;
}

// Games
export interface GameListItem {
  id: any; // ObjectId or string
  name: string;
  description: string;
  state: GameState;
  settings: GameSettings;
  userHasJoined: boolean;
}

// Galaxy Structure
// Derived from server/src/services/GalaxyService.ts
export interface Galaxy {
    game: Game;
    players: Player[];
    hexes: Hex[];
    planets: Planet[];
    stations: Station[];
    units: Unit[];
}

export interface GameListResponse extends Array<GameListItem> {}

export interface JoinGameResponse {
  player: Player;
}

export interface GameDetailsResponse extends Galaxy {}

export interface GameEventsResponse extends Array<any> {} // TODO: Define Event type if available

// Units
export interface DeployUnitResponse {
  unit: Unit;
}

// Stations
export interface BuildStationResponse {
  station: Station;
  prestigeCost: number;
}

// Users
export interface UserDetailsResponse extends User {}
