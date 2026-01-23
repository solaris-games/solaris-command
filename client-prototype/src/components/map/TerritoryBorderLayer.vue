<script setup lang="ts">
import { computed } from "vue";
import { useGalaxyStore } from "@/stores/galaxy";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";
import { hexToPixel } from "@/utils/hexUtils";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();

type APIHex = GameGalaxyResponseSchema["hexes"][0];

interface Border {
  points: string;
  color: string;
}

const borders = computed<Border[]>(() => {
  if (!galaxyStore.hexes || !galaxyStore.players) {
    return [];
  }

  const playerTerritories = new Map<string, APIHex[]>();
  for (const hex of galaxyStore.hexes) {
    if (hex.playerId) {
      if (!playerTerritories.has(String(hex.playerId))) {
        playerTerritories.set(String(hex.playerId), []);
      }
      playerTerritories.get(String(hex.playerId))!.push(hex);
    }
  }

  const borderPaths: Border[] = [];

  for (const [playerId, territoryHexes] of playerTerritories.entries()) {
    const player = galaxyStore.playerLookup!.get(String(playerId))!;
    const playerColor = PLAYER_COLOR_LOOKUP.get(player.color);
    if (!playerColor) continue;

    const territoryHexIds = new Set(
      territoryHexes.map((h) => String(HexUtils.getCoordsID(h.location))),
    );

    for (const hex of territoryHexes) {
      const center = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
      for (let i = 0; i < 6; i++) {
        const neighbor = HexUtils.neighbor(hex.location, i);
        const neighborId = HexUtils.getCoordsID(neighbor);

        if (!territoryHexIds.has(String(neighborId))) {
          const directionToCorners: number[][] = [
            [5, 0], // E-ish
            [4, 5], // SE
            [3, 4], // SW
            [2, 3], // W-ish
            [1, 2], // NW
            [0, 1], // NE
          ];
          const [c1_idx, c2_idx] = directionToCorners[i]!;
          const p1 = hexCorner(center, HEX_SIZE - 2, c1_idx);
          const p2 = hexCorner(center, HEX_SIZE - 2, c2_idx);
          borderPaths.push({
            points: `${p1.x},${p1.y} ${p2.x},${p2.y}`,
            color: playerColor.background,
          });
        }
      }
    }
  }

  return borderPaths;
});

function hexCorner(center: { x: number; y: number }, size: number, i: number) {
  const angle_deg = 60 * i + 30;
  const angle_rad = (Math.PI / 180) * angle_deg;
  return {
    x: center.x + size * Math.cos(angle_rad),
    y: center.y + size * Math.sin(angle_rad),
  };
}
</script>

<template>
  <v-layer :config="{ perfectDrawEnabled: false, listening: false }">
    <v-line
      v-for="(border, index) in borders"
      :key="index"
      :config="{
        points: border.points
          .split(' ')
          .flatMap((p) => p.split(',').map(Number)),
        stroke: border.color,
        strokeWidth: 6,
        lineCap: 'round',
        lineJoin: 'round',
      }"
    />
  </v-layer>
</template>
