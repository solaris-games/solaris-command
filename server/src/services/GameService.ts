import { ClientSession, ObjectId } from "mongodb";
import {
  Game,
  GameStates,
  Player,
  FogOfWar,
  Unit,
  Planet,
  Station,
  Hex,
} from "@solaris-command/core";
import { getDb } from "../db/instance";
import { UnitService } from "./UnitService";
import { StationService } from "./StationService";
import { PlanetService } from "./PlanetService";
import { HexService } from "./HexService";
import { PlayerService } from "./PlayerService";

export class GameService {
  static async listGames(userId: ObjectId) {
    const db = getDb();

    // 1. Find games where user is a player
    const myPlayers = await db
      .collection<Player>("players")
      .find({ userId })
      .toArray();

    const myGameIds = myPlayers.map((p) => p.gameId);

    // 2. Query Games
    const games = await db
      .collection<Game>("games")
      .find({
        $or: [
          { _id: { $in: myGameIds } },
          { "state.status": GameStates.PENDING },
        ],
      })
      .sort({ "state.startDate": -1 })
      .limit(50)
      .toArray();

    return { games, myGameIds };
  }

  static async createGame(gameData: any) {
    const db = getDb();
    const result = await db.collection("games").insertOne(gameData);
    return { id: result.insertedId, ...gameData };
  }

  static async getGameState(game: Game, userId: string) {
    // This method assumes 'game' is already loaded (e.g. by middleware)
    const gameId = game._id;

    const [players, hexes, allUnits, planets, stations] = await Promise.all([
      PlayerService.getByGameId(gameId),
      HexService.getByGameId(gameId),
      UnitService.getByGameId(gameId),
      PlanetService.getByGameId(gameId),
      StationService.getByGameId(gameId),
    ]);

    const currentPlayer = players.find((p) => String(p.userId) === userId);

    let response: any = {
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

      response.units = FogOfWar.filterVisibleUnits(
        currentPlayer._id,
        allUnits,
        visibleHexes
      );
    } else if (game.state.status === GameStates.COMPLETED) {
      // Reveal all
      response.units = allUnits;
    } else {
      // Spectator or Pending
      if (game.state.status === GameStates.PENDING && currentPlayer) {
        response.units = allUnits.filter(
          (u) => u.playerId.toString() === currentPlayer._id.toString()
        );
      } else {
        // Spectator: See map (hexes, planets, stations) but NO units
        response.units = [];
      }
    }

    return { response, currentPlayer };
  }

  static async getGameEvents(gameId: ObjectId) {
      const db = getDb();
      return db
      .collection("game_events")
      .find({ gameId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
  }
}
