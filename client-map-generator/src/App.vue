<template>
  <div class="app-container">
    <ControlPanel @save="handleSave" />
    <HexMap />
  </div>
</template>

<script setup lang="ts">
import ControlPanel from "./components/ControlPanel.vue";
import HexMap from "./components/HexMap.vue";
import { mapStore } from "./stores/mapStore";
import { Hex } from "@solaris-command/core/src/types/hex";
import { Planet } from "@solaris-command/core/src/types/planet";

function handleSave() {
  const capitals = Array.from(mapStore.hexes.values()).filter(
    (h) => h.isCapital
  ).length;

  if (capitals !== mapStore.playerCount) {
    console.warn(
      `Validation Warning: Found ${capitals} capitals, expected ${mapStore.playerCount}.`
    );
    alert(
      `Warning: You have ${capitals} capital planets, but Player Count is ${mapStore.playerCount}. Please correct this before using the map.`
    );
  }

  const hexesOutput = [];
  const planetsOutput = [];

  for (const hex of mapStore.hexes.values()) {
    const hexObj: Partial<Hex> = {
      location: { q: hex.q, r: hex.r, s: hex.s },
      terrain: hex.terrain,
    };

    hexesOutput.push(hexObj);

    if (hex.hasPlanet) {
      const planetObj: Partial<Planet> = {
        location: { q: hex.q, r: hex.r, s: hex.s },
        isCapital: hex.isCapital,
      };

      planetsOutput.push(planetObj);
    }
  }

  const output = {
    id: mapStore.mapId,
    name: mapStore.mapName,
    radius: mapStore.radius,
    playerCount: mapStore.playerCount,
    victoryPointsToWin: mapStore.victoryPointsToWin,
    hexes: hexesOutput,
    planets: planetsOutput,
  };

  console.log("--- MAP EXPORT ---");
  console.log(JSON.stringify(output, null, 2));
  console.log("------------------");
  alert("Map data exported to console!");
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: sans-serif;
}

.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
}
</style>
