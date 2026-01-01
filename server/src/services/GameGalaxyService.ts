import { ClientSession, Types } from "mongoose";
import {
  Game,
  GameStates,
  Player,
  FogOfWar,
  Hex,
  Planet,
  Station,
  Unit,
  UnifiedId,
} from "@solaris-command/core";
import { UnitService } from "./UnitService";
import { StationService } from "./StationService";
import { PlanetService } from "./PlanetService";
import { HexService } from "./HexService";
import { PlayerService } from "./PlayerService";

export interface GameGalaxy {
  game: Game;
  players: Player[];
  hexes: Hex[];
  planets: Planet[];
  stations: Station[];
  units: Unit[];
}

export class GameGalaxyService {
  static async getGameGalaxy(game: Game, userId: UnifiedId) {
    const gameId = game._id;

    const [players, hexes, allUnits, planets, stations] = await Promise.all([
      PlayerService.getByGameId(gameId),
      HexService.getByGameId(gameId),
      UnitService.getByGameId(gameId),
      PlanetService.getByGameId(gameId),
      StationService.getByGameId(gameId),
    ]);

    const currentPlayer = players.find(
      (p) => String(p.userId) === String(userId)
    );

    let galaxy: any = {
      game: game,
      players,
      hexes: [], // Will be masked
      planets,
      stations,
      units: [], // Will be filtered
    };

    if (game.state.status === GameStates.COMPLETED) {
      // Reveal all
      galaxy.hexes = hexes;
      galaxy.units = allUnits;

      return { galaxy, currentPlayer };
    }

    if (currentPlayer) {
      // Apply Fog of War for Units
      // We need to cast Mongoose Documents to POJOs or compatible types if core expects strict interfaces.
      // Usually Mongoose documents satisfy the interface unless there are specific methods or hidden fields.
      // FogOfWar expects arrays of objects.
      // Using .toObject() or just passing them might work depending on 'core' implementation.
      // For now, assuming direct pass works or we might need to .map(d => d.toObject()) if methods are issue.
      // Since core is shared, it likely treats them as data.

      const visibleHexes = FogOfWar.getVisibleHexes(
        currentPlayer._id,
        allUnits,
        planets,
        stations
      );

      galaxy.hexes = FogOfWar.maskHexes(currentPlayer._id, hexes, visibleHexes);

      galaxy.units = FogOfWar.filterVisibleUnits(
        currentPlayer._id,
        allUnits,
        visibleHexes
      );
    } else {
      // Spectator: See map (hexes, planets, stations) but NO units
      galaxy.hexes = FogOfWar.maskAllHexes(hexes);
      galaxy.units = [];
    }

    return { galaxy, currentPlayer };
  }
}
