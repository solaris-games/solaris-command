import {
  Game,
  JoinGameResponseSchema,
  GameEventsResponseSchema,
  Player,
  GameListItemResponseSchema,
  GameEvent,
  UnifiedId,
} from "@solaris-command/core";

export class GameMapper {
  static toGameListResponse(
    games: Game[],
    myGameIds: UnifiedId[]
  ): GameListItemResponseSchema[] {
    return games.map((g) => ({
      _id: String(g._id),
      name: g.name,
      mapName: g.mapName,
      description: g.description,
      state: {
        status: g.state.status,
        playerCount: g.state.playerCount,
        tick: g.state.tick,
        cycle: g.state.cycle,
      },
      settings: {
        playerCount: g.settings.playerCount,
      },
      userHasJoined: myGameIds.some((id) => id.toString() === g._id.toString()),
    }));
  }

  static toJoinGameResponse(player: Player): JoinGameResponseSchema {
    return {
      player, // Safe to use full model
    };
  }

  static toGameEventsResponse(events: GameEvent[]): GameEventsResponseSchema[] {
    return events.map((e) => ({
      _id: String(e._id),
      gameId: String(e.gameId),
      playerId: e.playerId?.toString() || null,
      tick: e.tick,
      cycle: e.cycle,
      type: e.type,
      data: e.data,
    }));
  }
}
