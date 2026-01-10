import { defineStore } from "pinia";
import axios from "axios";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import type { HexCoords } from "@solaris-command/core/src/types/geometry";
import { Player } from "@solaris-command/core/src/types/player";
import { UnifiedId } from "@solaris-command/core/src/types/unified-id";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";

interface SelectedItem {
  type: "HEX" | "UNIT" | "STATION" | "PLANET";
  id?: UnifiedId;
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
    selectedHex: null as APIHex | null,
    selectedUnit: null as APIUnit | null,
    selectedPlanet: null as APIPlanet | null,
    selectedStation: null as APIStation | null,
    currentPlayerId: null as string | null,
    currentPlayer: null as Player | null,
    playerLookup: null as Map<string, Player> | null,
    hexLookup: null as Map<string, APIHex> | null,
    movePath: [] as HexCoords[],
    isMoveMode: false,
    isAttackMode: false,
    showSupply: false, // Toggle state
    showZOC: false, // Toggle state
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
    async fetchGalaxy(gameId: UnifiedId) {
      this.loading = true;
      try {
        const response = await axios.get(`/api/v1/games/${gameId}`);
        this.galaxy = response.data;
        this.playerLookup = new Map<string, Player>()
        for (const player of this.galaxy!.players!) {
          this.playerLookup.set(String(player._id), player as any);
        }

        this.hexLookup = new Map<string, APIHex>();
        for (const hex of this.galaxy!.hexes!) {
          this.hexLookup.set(String(HexUtils.getCoordsID(hex.location)), hex);
        }

        this.currentPlayer =
          response.data.players.find((p: any) => p.userId != null) ?? null;
        this.currentPlayerId =
          response.data.players.find((p: any) => p.userId != null)?._id ?? null;

      } catch (err: any) {
        this.error = err.message || "Failed to fetch galaxy";
      } finally {
        this.loading = false;
      }
    },
    selectHex(hex: APIHex) {
      // If we are in move mode and have a unit selected
      if (this.isMoveMode && this.selectedUnit) {
        this.handleMoveSelection(hex);
        return;
      }

      // If we are in attack mode and have a unit selected
      if (this.isAttackMode && this.selectedUnit) {
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

      this.selectedHex = hex;
      this.selectedUnit = this.units.find(
        (u) =>
          u.location.q === hex.location.q && u.location.r === hex.location.r
      ) ?? null;
      this.selectedPlanet = this.planets.find(
        (p) =>
          p.location.q === hex.location.q && p.location.r === hex.location.r
      ) ?? null;
      this.selectedStation = this.stations.find(
        (s) =>
          s.location.q === hex.location.q && s.location.r === hex.location.r
      ) ?? null;

      // Reset modes
      this.isMoveMode = false;
      this.isAttackMode = false;
      this.movePath = [];
    },
    toggleMoveMode() {
      if (!this.selectedUnit) return;
      this.isMoveMode = !this.isMoveMode;
      this.isAttackMode = false;
      this.movePath = [];
    },
    toggleAttackMove() {
      if (!this.selectedUnit) return;
      this.isAttackMode = !this.isAttackMode;
      this.isMoveMode = false;
    },
    toggleSupply() {
      this.showSupply = !this.showSupply;
    },
    toggleZOC() {
      this.showZOC = !this.showZOC;
    },
    async handleMoveSelection(targetHex: APIHex) {
      if (!this.selectedUnit) return;
      const unitId = this.selectedUnit._id;
      const path = [targetHex._id];

      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/${unitId}/move`,
          { hexIdPath: path }
        );
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.isMoveMode = false;
        this.selectedHex = null;
        this.selectedUnit = null;
        this.selectedPlanet = null;
        this.selectedStation = null;
      } catch (err: any) {
        alert("Move failed: " + (err.response?.data?.errorCode || err.message));
      }
    },
    async cancelMovement(unit: APIUnit) {
      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/${unit._id}/cancel-move`,
          {}
        );
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.selectedHex = null;
        this.selectedUnit = null;
        this.selectedPlanet = null;
        this.selectedStation = null;
      } catch (err: any) {
        alert(
          "Cancel move failed: " +
            (err.response?.data?.errorCode || err.message)
        );
      }
    },
    async handleAttackSelection(targetUnit: APIUnit) {
      if (!this.selectedUnit) return;
      const attackerId = this.selectedUnit._id;
      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/${attackerId}/attack`,
          {
            location: targetUnit.location,
            operation: "STANDARD",
            advanceOnVictory: false,
          }
        );
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.isAttackMode = false;
        this.selectedHex = null;
        this.selectedUnit = null;
        this.selectedPlanet = null;
        this.selectedStation = null;
      } catch (err: any) {
        alert(
          "Attack failed: " + (err.response?.data?.errorCode || err.message)
        );
      }
    },
    async cancelAttack(unit: APIUnit) {
      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/${unit._id}/cancel-attack`,
          {}
        );
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.selectedHex = null;
        this.selectedUnit = null;
        this.selectedPlanet = null;
        this.selectedStation = null;
      } catch (err: any) {
        alert(
          "Cancel attack failed: " +
            (err.response?.data?.errorCode || err.message)
        );
      }
    },
    async buildStation() {
      if (!this.selectedHex) return;
      const hex = this.selectedHex;
      try {
        await axios.post(`/api/v1/games/${this.galaxy?.game._id}/stations`, {
          hexId: hex._id,
        });
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.selectedHex = null;
        this.selectedUnit = null;
        this.selectedPlanet = null;
        this.selectedStation = null;
      } catch (err: any) {
        alert(
          "Build failed: " + (err.response?.data?.errorCode || err.message)
        );
      }
    },
    async deleteStation() {
      if (!this.selectedStation) return;
      const station = this.selectedStation;
      try {
        await axios.delete(
          `/api/v1/games/${this.galaxy?.game._id}/stations/${station._id}`
        );
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.selectedHex = null;
        this.selectedUnit = null;
        this.selectedPlanet = null;
        this.selectedStation = null;
      } catch (err: any) {
        alert(
          "Delete failed: " + (err.response?.data?.errorCode || err.message)
        );
      }
    },
    async deployUnit(catalogId: string) {
      if (!this.selectedHex) return;
      const hex = this.selectedHex;
      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/deploy`,
          {
            catalogId,
            hexId: hex._id,
          }
        );
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.selectedHex = null;
        this.selectedUnit = null;
        this.selectedPlanet = null;
        this.selectedStation = null;
      } catch (err: any) {
        alert(
          "Deploy failed: " + (err.response?.data?.errorCode || err.message)
        );
      }
    },
    async upgradeUnitStep(unit: APIUnit) {
      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/${unit._id}/upgrade`,
          {
            type: "STEP",
            specialistId: null,
          }
        );
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.selectedHex = null;
        this.selectedUnit = null;
        this.selectedPlanet = null;
        this.selectedStation = null;
      } catch (err: any) {
        alert(
          "Upgrade unit step failed: " +
            (err.response?.data?.errorCode || err.message)
        );
      }
    },
    async upgradeUnitStepScout(unit: APIUnit) {
      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/${unit._id}/upgrade`,
          {
            type: "SPECIALIST",
            specialistId: 'spec_scouts_01',
          }
        );
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.selectedHex = null;
        this.selectedUnit = null;
        this.selectedPlanet = null;
        this.selectedStation = null;
      } catch (err: any) {
        alert(
          "Upgrade unit step failed: " +
            (err.response?.data?.errorCode || err.message)
        );
      }
    },
    async scrapUnitStep(unit: APIUnit) {
      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/${unit._id}/scrap`,
          {}
        );
        await this.fetchGalaxy(this.galaxy!.game._id);
        this.selectedHex = null;
        this.selectedUnit = null;
        this.selectedPlanet = null;
        this.selectedStation = null;
      } catch (err: any) {
        alert(
          "Scrap unit step failed: " +
            (err.response?.data?.errorCode || err.message)
        );
      }
    },
  },
});
