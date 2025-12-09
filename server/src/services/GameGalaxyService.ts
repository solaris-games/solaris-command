import { ClientSession, Db, ObjectId } from "mongodb";
import { Game, GameStates, Player, FogOfWar, Hex, Planet, Station, Unit } from "@solaris-command/core";
import { UnitService } from "./UnitService";
import { StationService } from "./StationService";
import { PlanetService } from "./PlanetService";
import { HexService } from "./HexService";
import { PlayerService } from "./PlayerService";

export interface GameGalaxy {
  game: Game,
  players: Player[],
  hexes: Hex[],
  planets: Planet[],
  stations: Station[],
  units: Unit[]
}

export class GameGalaxyService {
  static async getGameGalaxy(db: Db, game: Game, userId: string) {
    const gameId = game._id;

    const [players, hexes, allUnits, planets, stations] = await Promise.all([
      PlayerService.getByGameId(db, gameId),
      HexService.getByGameId(db, gameId),
      UnitService.getByGameId(db, gameId),
      PlanetService.getByGameId(db, gameId),
      StationService.getByGameId(db, gameId),
    ]);

    const currentPlayer = players.find((p) => String(p.userId) === userId);

    let galaxy: any = {
      game: game,
      players,
      hexes,
      planets,
      stations,
      units: [],
    };

    if (currentPlayer && game.state.status === GameStates.ACTIVE) {
      // Apply Fog of War for Units
      const visibleHexes = FogOfWar.getVisibleHexes(
        currentPlayer._id,
        allUnits,
        planets,
        stations
      );

      galaxy.units = FogOfWar.filterVisibleUnits(
        currentPlayer._id,
        allUnits,
        visibleHexes
      );
    } else if (game.state.status === GameStates.COMPLETED) {
      // Reveal all
      galaxy.units = allUnits;
    } else {
      // Spectator or Pending
      if (game.state.status === GameStates.PENDING && currentPlayer) {
        galaxy.units = allUnits.filter(
          (u) => u.playerId.toString() === currentPlayer._id.toString()
        );
      } else {
        // Spectator: See map (hexes, planets, stations) but NO units
        galaxy.units = [];
      }
    }

    return { galaxy, currentPlayer };
  }
}
