import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";
import { MapUtils } from "@solaris-command/core/src/utils/map-utils";
import axios from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useGalaxyStore } from "./galaxy";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";

type APIUnit = GameGalaxyResponseSchema["units"][0];
type APIHex = GameGalaxyResponseSchema["hexes"][0];

export const useMovementStore = defineStore("movement", () => {
  const isMoveMode = ref(false);
  const startHex = ref<APIHex | null>(null);
  const movementPath = ref<APIHex[]>([]);
  const movementPathMPCost = ref<number>(0);
  const reachableHexes = ref<APIHex[]>([]);

  function toggleMoveMode() {
    isMoveMode.value = !isMoveMode.value;
  }

  function recalculateReachableHexes() {
    const galaxyStore = useGalaxyStore();
    if (!galaxyStore.galaxy) return;

    // Recalculate reachable hexes from the new last hex
    const lastHex =
      movementPath.value[movementPath.value.length - 1] || startHex.value;

    // Recalculate reachable hexes from the new last hex
    reachableHexes.value = HexUtils.neighbors(lastHex.location)
      .map((id) => galaxyStore.hexLookup!.get(String(HexUtils.getCoordsID(id))))
      .filter((hex) => hex != null)
      .filter((hex) => !MapUtils.isTerrainImpassable(hex.terrain));
  }

  function startMove(unit: APIUnit) {
    const galaxyStore = useGalaxyStore();
    if (!galaxyStore.galaxy) return;

    galaxyStore.selectedUnit = unit; // Set selected unit in galaxy store

    startHex.value = galaxyStore.hexLookup?.get(
      String(HexUtils.getCoordsID(unit.location)),
    )!;

    if (!startHex.value) {
      console.error("Start hex not found for unit:", unit);
      return;
    }

    movementPath.value = [];
    movementPathMPCost.value = 0;
    isMoveMode.value = true;
    recalculateReachableHexes();
  }

  function addHexToPath(hex: APIHex) {
    const galaxyStore = useGalaxyStore();
    if (!galaxyStore.galaxy || !galaxyStore.selectedUnit) return;

    // Don't let the user create crazy long paths.
    if (movementPath.value.length >= 24) {
      return;
    }

    if (reachableHexes.value.some((h) => h._id === hex._id)) {
      // If the hex is reachable, add it to the path
      movementPath.value.push(hex);
    movementPathMPCost.value += MapUtils.getHexMPCost(hex, galaxyStore.currentPlayerId, false);
    } else {
      // If not reachable, don't add
      return;
    }

    recalculateReachableHexes();
  }

  function undoMove() {
    const galaxyStore = useGalaxyStore();
    if (!galaxyStore.galaxy || !galaxyStore.selectedUnit) return;

    if (movementPath.value.length) {
      const hex = movementPath.value.pop();
    movementPathMPCost.value -= MapUtils.getHexMPCost(hex as any, galaxyStore.currentPlayerId, false);
      recalculateReachableHexes();
    }
  }

  function cancelMove() {
    isMoveMode.value = false;
    movementPath.value = [];
    movementPathMPCost.value = 0;
    reachableHexes.value = [];
  }

  async function confirmMove() {
    const galaxyStore = useGalaxyStore();

    if (!galaxyStore.selectedUnit) return;

    const unitId = galaxyStore.selectedUnit._id;
    const path = movementPath.value.map((hex) => hex._id);

    try {
      await axios.post(
        `/api/v1/games/${galaxyStore.galaxy?.game._id}/units/${unitId}/move`,
        { hexIdPath: path },
      );

      await galaxyStore.fetchGalaxy(galaxyStore.galaxy!.game._id);

      isMoveMode.value = false;
      movementPath.value = [];
    movementPathMPCost.value = 0;
      reachableHexes.value = [];
    } catch (err: any) {
      alert("Move failed: " + (err.response?.data?.errorCode || err.message));
    }
  }

  return {
    isMoveMode,
    startHex,
    movementPath,
    movementPathMPCost,
    reachableHexes,
    toggleMoveMode,
    startMove,
    addHexToPath,
    undoMove,
    cancelMove,
    confirmMove,
  };
});
