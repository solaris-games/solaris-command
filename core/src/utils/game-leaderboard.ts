import { Planet } from "../types/planet";
import { Player, PlayerStatus } from "../types/player";
import { UnifiedId } from "../types/unified-id";
import { Unit } from "../types/unit";
import { UnitManager } from "./unit-manager";

export const GameLeaderboardUtils = {
  getLeaderboard(players: Player[], planets: Planet[], units: Unit[]) {
    // --- PRE-CALCULATION STEP ---

    // 1. Count Planets per Player
    const planetCounts = new Map<string, number>();
    for (const p of planets) {
      if (p.playerId) {
        const id = String(p.playerId);
        planetCounts.set(id, (planetCounts.get(id) || 0) + 1);
      }
    }

    // 2. Count Active Units per Player
    const unitCounts = new Map<string, number>();
    for (const u of units) {
      // Only count if unit is alive and has an owner
      if (u.playerId && UnitManager.unitIsAlive(u)) {
        const id = String(u.playerId);
        unitCounts.set(id, (unitCounts.get(id) || 0) + 1);
      }
    }

    // --- SORTING STEP ---

    return players
      .slice() // Copy array to protect original order
      .sort((a, b) => {
        const idA = String(a._id);
        const idB = String(b._id);

        // 1. Status: Active players first
        const aIsActive = a.status === PlayerStatus.ACTIVE;
        const bIsActive = b.status === PlayerStatus.ACTIVE;
        if (aIsActive !== bIsActive) {
          return aIsActive ? -1 : 1;
        }

        // 2. Victory Points (Highest wins)
        if (b.victoryPoints !== a.victoryPoints) {
          return b.victoryPoints - a.victoryPoints;
        }

        // 3. Total Planets (Highest wins) -> O(1) Lookup
        const planetsA = planetCounts.get(idA) || 0;
        const planetsB = planetCounts.get(idB) || 0;
        if (planetsB !== planetsA) {
          return planetsB - planetsA;
        }

        // 4. Total Units (Highest wins) -> O(1) Lookup
        const unitsA = unitCounts.get(idA) || 0;
        const unitsB = unitCounts.get(idB) || 0;
        if (unitsB !== unitsA) {
          return unitsB - unitsA;
        }

        // 5. Defeated date descending
        if (a.defeatedDate && b.defeatedDate) {
          return b.defeatedDate.getTime() - a.defeatedDate.getTime();
        } else if (a.defeatedDate) {
          return -1; // a has a defeatedDate, b does not, so a comes first (descending)
        } else if (b.defeatedDate) {
          return 1; // b has a defeatedDate, a does not, so b comes first (descending)
        }

        // Equal
        return 0;
      });
  },

  calculateGameRankRewards(
    players: Player[],
    planets: Planet[],
    units: Unit[]
  ): {
    userId: UnifiedId,
    playerId: UnifiedId;
    rankChange: number;
    finalRankPosition: number;
  }[] {
    // 1. Get the sorted list of players
    const leaderboard = GameLeaderboardUtils.getLeaderboard(
      players,
      planets,
      units
    );
    const playerCount = players.length;

    // 2. Map over the leaderboard to calculate rewards
    const rankResults = leaderboard.map((player, index) => {
      let rankChange = 0;

      // --- CALCULATE RANK ---

      // Case A: 1st Place (Winner)
      // They receive rank equal to the total number of players.
      if (index === 0) {
        rankChange = playerCount;
      }
      // Case B: Everyone else
      // Formula: (Total / 2) - RankIndex
      else {
        rankChange = playerCount / 2 - index;
      }

      // --- HANDLE AFK PENALTY ---

      // If a player went AFK, they forfeit any gains.
      // We force their result to -1.
      if (player.status === PlayerStatus.AFK) {
        rankChange = -1;
      }

      return {
        userId: player.userId,
        playerId: player._id,
        rankChange: rankChange,
        finalRankPosition: index + 1, // Useful for UI (1st, 2nd, 3rd)
      };
    });

    return rankResults;
  },
};
