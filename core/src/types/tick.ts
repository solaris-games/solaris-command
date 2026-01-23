import { GameEventFactory } from "../factories/game-event-factory";
import { GameEvent, GameEventTypes } from "./game-event";
import { Game } from "./game";
import { Player } from "./player";
import { Hex } from "./hex";
import { Unit, UnitStatus } from "./unit";
import { Planet } from "./planet";
import { Station } from "./station";
import { HexCoordsId } from "./geometry";
import { UnifiedId } from "./unified-id";
import { HexUtils } from "../utils/hex-utils";

export class TickContext {
  game: Game;
  players: Player[];
  hexes: Hex[];
  units: Unit[];
  planets: Planet[];
  stations: Station[];

  // --- WORKING SETS (In-Memory State) ---
  // We track unit locations in a Map for O(1) lookup during collision/combat checks.
  // This map is updated continuously as the Tick progresses (e.g., after a Blitz move).
  hexLookup: Map<HexCoordsId, Hex>;
  unitLocations: Map<HexCoordsId, Unit>;
  planetLookup: Map<HexCoordsId, Planet>;
  stationLookup: Map<HexCoordsId, Station>;
  playerLookup: Map<string, Player>;

  // We need to track units that are regrouping from the previous tick.
  // Combat acts on regrouping units so we'll use the raw status of the unit in the combat phase,
  // and then reset any regrouping units that were not in combat back to idle at the end of the tick.
  preTickRegroupingUnits: Map<string, Unit>;
  postTickRegroupingUnits: Map<string, Unit>;

  // --- OUTPUT CONTAINERS ---
  gameEvents: GameEvent[] = [];
  stationsToRemove: UnifiedId[] = [];
  winnerPlayerId: UnifiedId | null = null;

  idGenerator: () => UnifiedId;

  constructor(
    game: Game,
    players: Player[],
    hexes: Hex[],
    units: Unit[],
    planets: Planet[],
    stations: Station[],
    idGenerator: () => UnifiedId,
  ) {
    this.game = game;
    this.players = players;
    this.hexes = hexes;
    this.units = units;
    this.planets = planets;
    this.stations = stations;

    this.idGenerator = idGenerator;

    // We track unit locations in a Map for O(1) lookup during collision/combat checks.
    // This map is updated continuously as the Tick progresses (e.g., after a Blitz move).
    this.hexLookup = new Map<HexCoordsId, Hex>();
    hexes.forEach((h) =>
      this.hexLookup.set(HexUtils.getCoordsID(h.location), h),
    );

    this.unitLocations = new Map<HexCoordsId, Unit>();
    units.forEach((u) =>
      this.unitLocations.set(HexUtils.getCoordsID(u.location), u),
    );

    // Lookup map for Planets to check for capture logic efficiently
    this.planetLookup = new Map<HexCoordsId, Planet>();
    planets.forEach((p) =>
      this.planetLookup.set(HexUtils.getCoordsID(p.location), p),
    );

    this.stationLookup = new Map<HexCoordsId, Station>();
    stations.forEach((s) =>
      this.stationLookup.set(HexUtils.getCoordsID(s.location), s),
    );

    this.playerLookup = new Map<string, Player>();
    players.forEach((p) => this.playerLookup.set(String(p._id), p));

    this.postTickRegroupingUnits = new Map<string, Unit>();
    this.preTickRegroupingUnits = new Map<string, Unit>();
    units
      .filter((u) => u.state.status === UnitStatus.REGROUPING)
      .forEach((u) => this.preTickRegroupingUnits.set(String(u._id), u));
  }

  appendGameEvent(playerId: UnifiedId | null, type: GameEventTypes, data: any) {
    this.gameEvents.push(
      GameEventFactory.create(
        this.game._id,
        playerId,
        this.game.state.tick,
        type,
        data,
        this.idGenerator,
      ),
    );
  }
}
