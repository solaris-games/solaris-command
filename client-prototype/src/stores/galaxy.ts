import { defineStore } from "pinia";
import axios from "axios";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import type { HexCoords } from "@solaris-command/core/src/types/geometry";

interface SelectedItem {
  type: "HEX" | "UNIT" | "STATION" | "PLANET";
  id?: string;
  data: any;
}

type APIHex = GameGalaxyResponseSchema["hexes"][0];
type APIUnit = GameGalaxyResponseSchema["units"][0];
type APIPlanet = GameGalaxyResponseSchema["planets"][0];
type APIStation = GameGalaxyResponseSchema["stations"][0];

export const useGalaxyStore = defineStore("galaxy", {
  state: () => ({
    galaxy: null as GameGalaxyResponseSchema | null,
    loading: false,
    error: null as string | null,
    selected: null as SelectedItem | null,
    currentPlayerId: null as string | null,
    movePath: [] as HexCoords[],
    isMoveMode: false,
    isAttackMode: false,
    showSupply: false, // Toggle state
  }),
  getters: {
    hexes: (state): APIHex[] => state.galaxy?.hexes || [],
    units: (state): APIUnit[] => state.galaxy?.units || [],
    planets: (state): APIPlanet[] => state.galaxy?.planets || [],
    stations: (state): APIStation[] => state.galaxy?.stations || [],
    mapWidth: (state) =>
      state.galaxy
        ? Math.max(...state.galaxy.hexes.map((h) => h.location.q)) * 2
        : 100,
    getHex: (state) => (q: number, r: number) =>
      state.galaxy?.hexes.find((h) => h.location.q === q && h.location.r === r),
  },
  actions: {
    async fetchGalaxy(gameId: string) {
      this.loading = true;
      try {
        const response = await axios.get(`/api/v1/games/${gameId}`);
        this.galaxy = response.data;
        this.currentPlayerId =
          response.data.players.find((p: any) => p.isUserPlayer)?._id ?? null;
      } catch (err: any) {
        this.error = err.message || "Failed to fetch galaxy";
      } finally {
        this.loading = false;
      }
    },
    selectHex(hex: APIHex) {
      // If we are in move mode and have a unit selected
      if (this.isMoveMode && this.selected?.type === "UNIT") {
        this.handleMoveSelection(hex);
        return;
      }

      // If we are in attack mode and have a unit selected
      if (this.isAttackMode && this.selected?.type === "UNIT") {
        // Find unit on this hex
        const unit = this.units.find(
          (u) =>
            u.location.q === hex.location.q && u.location.r === hex.location.r
        );
        if (unit) {
          this.handleAttackSelection(unit);
        }
        return;
      }

      const unit = this.units.find(
        (u) =>
          u.location.q === hex.location.q && u.location.r === hex.location.r
      );
      const planet = this.planets.find(
        (p) =>
          p.location.q === hex.location.q && p.location.r === hex.location.r
      );
      const station = this.stations.find(
        (s) =>
          s.location.q === hex.location.q && s.location.r === hex.location.r
      );

      if (unit) {
        this.selected = { type: "UNIT", id: unit._id, data: unit };
      } else if (station) {
        this.selected = { type: "STATION", id: station._id, data: station };
      } else if (planet) {
        this.selected = { type: "PLANET", id: planet._id, data: planet };
      } else {
        this.selected = { type: "HEX", id: hex._id, data: hex };
      }

      // Reset modes
      this.isMoveMode = false;
      this.isAttackMode = false;
      this.movePath = [];
    },
    startMoveMode() {
      if (this.selected?.type !== "UNIT") return;
      this.isMoveMode = true;
      this.isAttackMode = false;
      this.movePath = [];
    },
    startAttackMode() {
      if (this.selected?.type !== "UNIT") return;
      this.isAttackMode = true;
      this.isMoveMode = false;
    },
    toggleSupply() {
      this.showSupply = !this.showSupply;
    },
    async handleMoveSelection(targetHex: APIHex) {
      if (!this.selected || this.selected.type !== "UNIT") return;
      const unitId = this.selected.id;
      const path = [targetHex._id];

      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/${unitId}/move`,
          { hexIdPath: path }
        );
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.isMoveMode = false;
        this.selected = null;
      } catch (err: any) {
        alert("Move failed: " + (err.response?.data?.errorCode || err.message));
      }
    },
    async handleAttackSelection(targetUnit: APIUnit) {
      if (!this.selected || this.selected.type !== "UNIT") return;
      const attackerId = this.selected.id;
      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/${attackerId}/attack`,
          {
            targetUnitId: targetUnit._id,
          }
        );
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.isAttackMode = false;
        this.selected = null;
      } catch (err: any) {
        alert(
          "Attack failed: " + (err.response?.data?.errorCode || err.message)
        );
      }
    },
    async buildStation() {
      if (!this.selected || this.selected.type !== "HEX") return;
      const hex = this.selected.data as APIHex;
      try {
        await axios.post(`/api/v1/games/${this.galaxy?.game._id}/stations`, {
          hexId: hex._id,
        });
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.selected = null;
      } catch (err: any) {
        alert(
          "Build failed: " + (err.response?.data?.errorCode || err.message)
        );
      }
    },
    async deleteStation() {
      if (!this.selected || this.selected.type !== "STATION") return;
      const station = this.selected.data as APIStation;
      try {
        await axios.delete(
          `/api/v1/games/${this.galaxy?.game._id}/stations/${station._id}`
        );
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.selected = null;
      } catch (err: any) {
        alert(
          "Delete failed: " + (err.response?.data?.errorCode || err.message)
        );
      }
    },
    async deployUnit(catalogId: string) {
      if (!this.selected || this.selected.type !== "HEX") return;
      const hex = this.selected.data as APIHex;
      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/deploy`,
          {
            catalogId,
            hexId: hex._id,
          }
        );
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.selected = null;
      } catch (err: any) {
        alert(
          "Deploy failed: " + (err.response?.data?.errorCode || err.message)
        );
      }
    },
  },
});
