import { defineStore } from "pinia";
import axios from "axios";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { Player } from "@solaris-command/core/src/types/player";
import { UnifiedId } from "@solaris-command/core/src/types/unified-id";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";
import { GameStates } from "@solaris-command/core/src/types";

type APIHex = GameGalaxyResponseSchema["hexes"][0];
type APIUnit = GameGalaxyResponseSchema["units"][0];
type APIPlanet = GameGalaxyResponseSchema["planets"][0];
type APIStation = GameGalaxyResponseSchema["stations"][0];
type APIPlayer = GameGalaxyResponseSchema["players"][0];

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
    unitLookup: null as Map<string, APIUnit> | null,
    planetLookup: null as Map<string, APIPlanet> | null,
    stationLookup: null as Map<string, APIStation> | null,
    isAttackMode: false,
    isGameInPlay: false,
    isGameClockRunning: false,
  }),
  getters: {
    players: (state): APIPlayer[] => state.galaxy?.players || [],
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
        this.playerLookup = new Map<string, Player>();
        for (const player of this.galaxy!.players!) {
          this.playerLookup.set(String(player._id), player as any);
        }

        this.hexLookup = new Map<string, APIHex>();
        for (const hex of this.galaxy!.hexes!) {
          this.hexLookup.set(String(HexUtils.getCoordsID(hex.location)), hex);
        }

        this.unitLookup = new Map<string, APIUnit>();
        for (const unit of this.galaxy!.units!) {
          this.unitLookup.set(
            String(HexUtils.getCoordsID(unit.location)),
            unit,
          );
        }

        this.planetLookup = new Map<string, APIPlanet>();
        for (const planet of this.galaxy!.planets!) {
          this.planetLookup.set(
            String(HexUtils.getCoordsID(planet.location)),
            planet,
          );
        }

        this.stationLookup = new Map<string, APIStation>();
        for (const station of this.galaxy!.stations!) {
          this.stationLookup.set(
            String(HexUtils.getCoordsID(station.location)),
            station,
          );
        }

        this.currentPlayer =
          response.data.players.find((p: any) => p.userId != null) ?? null;
        this.currentPlayerId =
          response.data.players.find((p: any) => p.userId != null)?._id ?? null;

        this.isGameInPlay =
          this.galaxy!.game.state.status === GameStates.ACTIVE ||
          this.galaxy!.game.state.status === GameStates.PENDING ||
          this.galaxy!.game.state.status === GameStates.STARTING;

        this.isGameClockRunning =
          this.galaxy!.game.state.status === GameStates.ACTIVE ||
          this.galaxy!.game.state.status === GameStates.STARTING;

        // Reload any selected hexes/planets/stations/units etc.
        if (this.selectedHex)
          this.selectedHex =
            this.hexLookup.get(
              String(HexUtils.getCoordsID(this.selectedHex.location)),
            ) ?? null;

        if (this.selectedUnit)
          this.selectedUnit =
            this.unitLookup.get(
              String(HexUtils.getCoordsID(this.selectedUnit.location)),
            ) ?? null;

        if (this.selectedPlanet)
          this.selectedPlanet =
            this.planetLookup.get(
              String(HexUtils.getCoordsID(this.selectedPlanet.location)),
            ) ?? null;

        if (this.selectedStation)
          this.selectedStation =
            this.stationLookup.get(
              String(HexUtils.getCoordsID(this.selectedStation.location)),
            ) ?? null;
      } catch (err: any) {
        this.error = err.message || "Failed to fetch galaxy";
      } finally {
        this.loading = false;
      }
    },
    selectHex(hex: APIHex) {
      // If we are in attack mode and have a unit selected
      if (this.isAttackMode && this.selectedUnit) {
        // Find unit on this hex
        const unit = this.units.find(
          (u) =>
            u.location.q === hex.location.q && u.location.r === hex.location.r,
        );
        if (unit) {
          this.handleAttackSelection(unit);
        }
        return;
      }

      this.selectedHex = hex;
      this.selectedUnit =
        this.units.find(
          (u) =>
            u.location.q === hex.location.q && u.location.r === hex.location.r,
        ) ?? null;
      this.selectedPlanet =
        this.planets.find(
          (p) =>
            p.location.q === hex.location.q && p.location.r === hex.location.r,
        ) ?? null;
      this.selectedStation =
        this.stations.find(
          (s) =>
            s.location.q === hex.location.q && s.location.r === hex.location.r,
        ) ?? null;

      // Reset modes
      this.isAttackMode = false;
    },
    toggleAttackMove() {
      if (!this.selectedUnit) return;
      this.isAttackMode = !this.isAttackMode;
    },
    async cancelMovement(unit: APIUnit) {
      if (!this.selectedUnit) {
        return;
      }

      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/${unit._id}/cancel-move`,
          {},
        );

        await this.fetchGalaxy(this.galaxy!.game._id);
      } catch (err: any) {
        alert(
          "Cancel move failed: " +
            (err.response?.data?.errorCode || err.message),
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
          },
        );

        await this.fetchGalaxy(this.galaxy!.game._id);

        this.isAttackMode = false;
      } catch (err: any) {
        alert(
          "Attack failed: " + (err.response?.data?.errorCode || err.message),
        );
      }
    },
    async cancelAttack(unit: APIUnit) {
      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/${unit._id}/cancel-attack`,
          {},
        );

        await this.fetchGalaxy(this.galaxy!.game._id);
      } catch (err: any) {
        alert(
          "Cancel attack failed: " +
            (err.response?.data?.errorCode || err.message),
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
      } catch (err: any) {
        alert(
          "Build failed: " + (err.response?.data?.errorCode || err.message),
        );
      }
    },
    async deleteStation() {
      if (!this.selectedStation) return;
      const station = this.selectedStation;
      try {
        await axios.delete(
          `/api/v1/games/${this.galaxy?.game._id}/stations/${station._id}`,
        );

        await this.fetchGalaxy(this.galaxy!.game._id);
      } catch (err: any) {
        alert(
          "Delete failed: " + (err.response?.data?.errorCode || err.message),
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
          },
        );

        await this.fetchGalaxy(this.galaxy!.game._id);
      } catch (err: any) {
        alert(
          "Deploy failed: " + (err.response?.data?.errorCode || err.message),
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
          },
        );

        await this.fetchGalaxy(this.galaxy!.game._id);
      } catch (err: any) {
        alert(
          "Upgrade unit step failed: " +
            (err.response?.data?.errorCode || err.message),
        );
      }
    },
    async hireSpecialist(unit: APIUnit, specialistId: string) {
      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/${unit._id}/upgrade`,
          {
            type: "SPECIALIST",
            specialistId: specialistId,
          },
        );

        await this.fetchGalaxy(this.galaxy!.game._id);
      } catch (err: any) {
        alert(
          "Hire specialist failed: " +
            (err.response?.data?.errorCode || err.message),
        );
      }
    },
    async scrapUnitStep(unit: APIUnit) {
      try {
        await axios.post(
          `/api/v1/games/${this.galaxy?.game._id}/units/${unit._id}/scrap`,
          {},
        );

        await this.fetchGalaxy(this.galaxy!.game._id);
      } catch (err: any) {
        alert(
          "Scrap unit step failed: " +
            (err.response?.data?.errorCode || err.message),
        );
      }
    },
  },
});
