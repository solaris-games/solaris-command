import { defineStore } from 'pinia';
import axios from 'axios';
import type { GameListItemResponseSchema } from '@solaris-command/core';

// Use the exact type from the response schema
type Game = GameListItemResponseSchema;

export const useGameStore = defineStore('game', {
  state: () => ({
    openGames: [] as Game[],
    myGames: [] as Game[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchGames() {
      this.loading = true;
      try {
        const response = await axios.get('/api/v1/games');
        const gamesList = response.data as Game[];

        // Filter client side if the API returns a flat list
        this.myGames = gamesList.filter((g: Game) => g.userHasJoined);
        this.openGames = gamesList.filter((g: Game) => !g.userHasJoined && g.state.status === 'PENDING');

      } catch (err: any) {
        this.error = err.message || 'Failed to fetch games';
      } finally {
        this.loading = false;
      }
    },
    async joinGame(gameId: string, alias: string, color: string) {
      try {
        await axios.post(`/api/v1/games/${gameId}/join`, { alias, color });
        await this.fetchGames(); // Refresh list
        return true;
      } catch (err: any) {
        this.error = err.response?.data?.errorCode || 'Failed to join game';
        return false;
      }
    },
    async leaveGame(gameId: string) {
       try {
        await axios.post(`/api/v1/games/${gameId}/leave`);
        await this.fetchGames();
        return true;
       } catch (err: any) {
           console.error(err);
           return false;
       }
    },
    async concedeGame(gameId: string) {
        if (!confirm('Are you sure you want to concede? This cannot be undone.')) return;
        try {
            await axios.post(`/api/v1/games/${gameId}/concede`);
            await this.fetchGames();
            return true;
        } catch(err: any) {
            console.error(err);
            return false;
        }
    }
  }
});
