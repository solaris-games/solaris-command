import {
  Game,
  GameListItem,
  GameListResponse,
  JoinGameResponse,
  GameDetailsResponse,
  GameEventsResponse,
  Player,
  Galaxy,
} from "@solaris-command/core";

export class GameMapper {
  static toGameListResponse(
    games: Game[],
    myGameIds: any[]
  ): GameListResponse {
    return games.map((g) => ({
      id: g._id,
      name: g.name,
      description: g.description,
      state: g.state,
      settings: g.settings,
      userHasJoined: myGameIds.some((id) => id.toString() === g._id.toString()),
    }));
  }

  static toJoinGameResponse(player: Player): JoinGameResponse {
    return {
      player,
    };
  }

  static toGameDetailsResponse(galaxy: Galaxy): GameDetailsResponse {
    return galaxy;
  }

  static toGameEventsResponse(events: any[]): GameEventsResponse {
    return events;
  }
}
