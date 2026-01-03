import { CONSTANTS } from "../data";
import { Player, PlayerStatus, UnifiedId } from "../types";

export const PlayerFactory = {
  create(
    gameId: UnifiedId,
    userId: UnifiedId,
    alias: string,
    color: string,
    renownToDistribute: number,
    idGenerator: () => UnifiedId
  ): Player {
    return {
      _id: idGenerator(),
      gameId,
      userId,
      alias,
      color,
      status: PlayerStatus.ACTIVE,
      prestigePoints: CONSTANTS.GAME_STARTING_PRESTIGE_POINTS,
      victoryPoints: 0,
      lastSeenDate: new Date(),
      renownToDistribute,
      isAIControlled: false
    };
  },
};
