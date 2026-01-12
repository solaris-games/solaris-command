<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from "vue";
import type { GameGalaxyResponseSchema } from "@solaris-command/core/src/types/api/responses";
import { TerrainTypes } from "@solaris-command/core/src/types/hex";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";
import { useGalaxyStore } from "@/stores/galaxy";
import { useMapSettingsStore } from "@/stores/mapSettings";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";
import seedrandom from "seedrandom";

type APIHex = GameGalaxyResponseSchema["hexes"][0];

const props = defineProps<{
  hex: APIHex;
}>();

const HEX_SIZE = 64;
const galaxyStore = useGalaxyStore();
const mapSettingsStore = useMapSettingsStore();
const groupRef = ref(null);
const backgroundImage = ref<HTMLImageElement | null>(null);
const middlegroundImage = ref<HTMLImageElement | null>(null);
const foregroundImage = ref<HTMLImageElement | null>(null);

const getPolygonConfig = computed(() => {
  let fill = "rgba(0, 0, 0, 0)";
  let stroke = "#444";

  if (props.hex.playerId) {
    const player = galaxyStore.playerLookup!.get(String(props.hex.playerId))!;
    const playerColor = PLAYER_COLOR_LOOKUP.get(player.color);
    if (playerColor) {
      fill = playerColor.background;
      stroke = playerColor.background;
    }
  }

  return {
    sides: 6,
    radius: HEX_SIZE - 2,
    fill,
    stroke: stroke,
    strokeWidth: 4,
    rotation: 60,
    opacity: 0.3,
  };
});

const getBackgroundImageConfig = computed(() => {
  return {
    image: backgroundImage.value,
    width: HEX_SIZE * 2,
    height: HEX_SIZE * 2,
    offsetX: HEX_SIZE,
    offsetY: HEX_SIZE,
    listening: false,
  };
});

const getMiddlegroundImageConfig = computed(() => {
  return {
    image: middlegroundImage.value,
    width: HEX_SIZE * 2,
    height: HEX_SIZE * 2,
    offsetX: HEX_SIZE,
    offsetY: HEX_SIZE,
    listening: false,
  };
});

const getForegroundImageConfig = computed(() => {
  return {
    image: foregroundImage.value,
    width: HEX_SIZE * 2,
    height: HEX_SIZE * 2,
    offsetX: HEX_SIZE,
    offsetY: HEX_SIZE,
    listening: false,
  };
});

const getCoordTextConfig = computed(() => {
  return {
    text: `${props.hex.location.q},${props.hex.location.r}`,
    fontSize: 12,
    fill: "#FFF",
    y: 40,
    offsetX: 12,
    listening: false,
  };
});

// Needed to add a debounce due to weird caching issues.
const debounce = (func: Function, delay: number) => {
  let timeoutId: number;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const recache = debounce(() => {
  // @ts-ignore
  groupRef.value?.getNode().clearCache();
  // @ts-ignore
  groupRef.value?.getNode().cache();
}, 50);

const loadImage = (
  src: string,
  target: "foreground" | "background" | "middleground"
) => {
  const img = new window.Image();
  img.src = src;
  img.onload = () => {
    if (target === "background") {
      backgroundImage.value = img;
    } else if (target === "middleground") {
      middlegroundImage.value = img;
    } else if (target === "foreground") {
      foregroundImage.value = img;
    }
    recache();
  };
};

onMounted(() => {
  if (
    !galaxyStore.galaxy ||
    !galaxyStore.planetLookup ||
    !galaxyStore.stationLookup
  ) {
    return;
  }

  const seed = `${galaxyStore.galaxy.game._id}-${props.hex.location.q}-${props.hex.location.r}`;
  const rng = seedrandom(seed);

  const emptyImages = 80;
  const emptyIndex = Math.floor(rng() * emptyImages) + 1;
  const emptyImage = `/assets/spaceland/terrain/empty/hk_empty-space_${String(
    emptyIndex
  ).padStart(3, "0")}.png`;
  loadImage(emptyImage, "background");

  const planet = galaxyStore.planetLookup.get(
    String(HexUtils.getCoordsID(props.hex.location))
  );

  if (planet) {
    const planetImages = 54;
    const planetIndex = Math.floor(rng() * planetImages) + 1;
    loadImage(
      `/assets/spaceland/planets/large/hk-planet_${String(planetIndex).padStart(
        3,
        "0"
      )}.png`,
      "middleground"
    );
    return;
  }

  switch (props.hex.terrain) {
    case TerrainTypes.ASTEROID_FIELD: {
      const images = 41;
      const index = Math.floor(rng() * images) + 1;
      loadImage(
        `/assets/spaceland/terrain/asteroid_fields/ast-${String(index).padStart(
          3,
          "0"
        )}.png`,
        "middleground"
      );
      break;
    }
    case TerrainTypes.DEBRIS_FIELD: {
      const images = 21;
      const index = Math.floor(rng() * images) + 1;
      loadImage(
        `/assets/spaceland/terrain/debris_fields/scrap${String(index).padStart(
          3,
          "0"
        )}.png`,
        "middleground"
      );
      break;
    }
    case TerrainTypes.GAS_CLOUD: {
      const images = 17;
      const index = Math.floor(rng() * images) + 1;
      loadImage(
        `/assets/spaceland/terrain/gas_clouds/radbris-${String(index).padStart(
          3,
          "0"
        )}.png`,
        "middleground"
      );
      break;
    }
    case TerrainTypes.GRAVITY_WELL: {
      const images = 13;
      const index = Math.floor(rng() * images) + 1;
      loadImage(
        `/assets/spaceland/terrain/anomalies/anom-${String(index).padStart(
          3,
          "0"
        )}.png`,
        "middleground"
      );
      break;
    }
    case TerrainTypes.INDUSTRIAL_ZONE: {
      const smallPlanetImages = 57;
      const industrialImages = 10;
      const smallPlanetIndex = Math.floor(rng() * smallPlanetImages) + 1;
      const industrialIndex = Math.floor(rng() * industrialImages) + 1;

      loadImage(
        `/assets/spaceland/planets/small/hk-moon_${String(
          smallPlanetIndex
        ).padStart(3, "0")}.png`,
        "middleground"
      );

      loadImage(
        `/assets/spaceland/terrain/industrial_zones/${String(
          industrialIndex
        )}.png`,
        "foreground"
      );
      return;
    }
    case TerrainTypes.RADIATION_STORM: {
      const images = 3;
      const index = Math.floor(rng() * images) + 1;
      const type = rng() > 0.5 ? "orascrn" : "redscrn";

      loadImage(
        `/assets/spaceland/terrain/radiation_storms/${type}-${String(
          index
        ).padStart(3, "0")}.png`,
        "middleground"
      );
      break;
    }
    case TerrainTypes.EMPTY:
    default: {
      break;
    }
  }

  const station = galaxyStore.stationLookup.get(
    `${props.hex.location.q},${props.hex.location.r}`
  );

  if (station) {
    const stationImages = 16;
    const stationIndex = Math.floor(rng() * stationImages) + 1;
    loadImage(
      `/assets/spaceland/stations/rs${String(stationIndex).padStart(
        3,
        "0"
      )}.png`,
      "foreground"
    );
  }
});

onUpdated(() => {
  recache();
});
</script>

<template>
  <v-group
    ref="groupRef"
    :config="{ perfectDrawEnabled: false, listening: false }"
  >
    <v-image v-show="backgroundImage" :config="getBackgroundImageConfig" />
    <v-image v-show="middlegroundImage" :config="getMiddlegroundImageConfig" />
    <v-image v-show="foregroundImage" :config="getForegroundImageConfig" />
  </v-group>

  <v-regular-polygon
    v-if="mapSettingsStore.showPlayerColors"
    :config="getPolygonConfig"
  />
  <v-text :config="getCoordTextConfig" />
</template>
