<template>
  <div ref="pixiContainer" class="pixi-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, provide } from "vue";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import { useGalaxyStore } from "../stores/galaxy";
import { useMapSettingsStore } from "../stores/mapSettings";
import { useMovementStore } from "../stores/movement";
import { useCombatStore } from "../stores/combat";
import { pixelToHex, hexToPixel } from "../utils/hexUtils";
import { PLAYER_COLOR_LOOKUP } from "@solaris-command/core/src/data/player-colors";
import { TerrainTypes } from "@solaris-command/core/src/types/hex";
import { HexUtils } from "@solaris-command/core/src/utils/hex-utils";
import { UNIT_CATALOG_ID_MAP } from "@solaris-command/core/src/data/units";
import { UnitClasses } from "@solaris-command/core/src/types/unit";
import {
  SPECIALIST_STEP_ID_MAP,
  SPECIALIST_STEP_SYMBOL_MAP,
} from "@solaris-command/core/src/data/specialists";
import seedrandom from "seedrandom";

const pixiContainer = ref<HTMLDivElement | null>(null);
const galaxyStore = useGalaxyStore();
const mapSettingsStore = useMapSettingsStore();
const movementStore = useMovementStore();
const combatStore = useCombatStore();

let app: PIXI.Application | null = null;
let viewport: Viewport | null = null;
const hexGraphicsContainer = new PIXI.Container();
const unitContainer = new PIXI.Container();
const selectionContainer = new PIXI.Container();

const HEX_SIZE = 64;
const COUNTER_WIDTH = 72;
const COUNTER_HEIGHT = 72;

const textures: Record<string, PIXI.Texture> = {};

async function loadTexture(url: string) {
  if (textures[url]) return textures[url];
  try {
    const texture = await PIXI.Assets.load(url);
    textures[url] = texture;
    return texture;
  } catch (e) {
    console.error(`Failed to load texture: ${url}`, e);
    return null;
  }
}

function getPlayerColor(playerId: string | number | undefined) {
  if (playerId === undefined)
    return {
      background: 0xffffff,
      foreground: 0x000000,
    };
  const player = galaxyStore.playerLookup?.get(String(playerId));
  if (!player)
    return {
      background: 0xffffff,
      foreground: 0x000000,
    };
  const color = PLAYER_COLOR_LOOKUP.get(player.color);
  if (!color)
    return {
      background: 0xffffff,
      foreground: 0x000000,
    };

  return {
    background: parseInt(color.background.replace("#", "0x")),
    foreground: parseInt(color.foreground.replace("#", "0x")),
  };
}

function drawHexagon(
  g: PIXI.Graphics,
  x: number,
  y: number,
  size: number,
  fill: number | null,
  stroke: number,
  strokeWidth: number,
  opacity: number,
) {
  g.setStrokeStyle({ width: strokeWidth, color: stroke, alpha: opacity });
  if (fill !== null) {
    g.fill({ color: fill, alpha: opacity });
  } else {
    g.fill({ color: 0x000000, alpha: 0 });
  }

  const angle = Math.PI / 3;
  const offset = -Math.PI / 6; // Rotate by 30 degrees to make it pointy-top
  const points = [];
  for (let i = 0; i < 6; i++) {
    points.push(
      x + size * Math.cos(i * angle + offset),
      y + size * Math.sin(i * angle + offset),
    );
  }
  g.poly(points, true);
}

async function renderGraphicalHex(hex: any, container: PIXI.Container) {
  const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
  const seed = `${galaxyStore.galaxy?.game._id}-${hex.location.q}-${hex.location.r}`;
  const rng = seedrandom(seed);

  // Background
  const emptyIndex = Math.floor(rng() * 80) + 1;
  const emptyImage = `/assets/spaceland/terrain/empty/hk_empty-space_${String(emptyIndex).padStart(3, "0")}.png`;
  const bgTexture = await loadTexture(emptyImage);
  if (bgTexture) {
    const sprite = new PIXI.Sprite(bgTexture);
    sprite.anchor.set(0.5);
    sprite.x = x;
    sprite.y = y;
    sprite.width = HEX_SIZE * 2;
    sprite.height = HEX_SIZE * 2;
    container.addChild(sprite);
  }

  // Middleground (Terrain/Planets)
  let mgImage = "";
  const planet = galaxyStore.planetLookup?.get(
    String(HexUtils.getCoordsID(hex.location)),
  );
  if (planet) {
    const starIndex = Math.floor(rng() * 27) + 1;
    mgImage = `/assets/spaceland/stars/sun${String(starIndex).padStart(3, "0")}.png`;
  } else {
    switch (hex.terrain) {
      case TerrainTypes.ASTEROID_FIELD:
        mgImage = `/assets/spaceland/terrain/asteroid_fields/ast-${String(Math.floor(rng() * 41) + 1).padStart(3, "0")}.png`;
        break;
      case TerrainTypes.DEBRIS_FIELD:
        mgImage = `/assets/spaceland/terrain/debris_fields/scrap${String(Math.floor(rng() * 21) + 1).padStart(3, "0")}.png`;
        break;
      case TerrainTypes.NEBULA:
        mgImage = `/assets/spaceland/terrain/nebulae/hk-nebula_${String(Math.floor(rng() * 84) + 1).padStart(3, "0")}.png`;
        break;
      case TerrainTypes.GAS_CLOUD:
        mgImage = `/assets/spaceland/terrain/gas_clouds/radbris-${String(Math.floor(rng() * 17) + 1).padStart(3, "0")}.png`;
        break;
      case TerrainTypes.GRAVITY_WELL:
        mgImage = `/assets/spaceland/terrain/anomalies/anom-${String(Math.floor(rng() * 13) + 1).padStart(3, "0")}.png`;
        break;
      case TerrainTypes.INDUSTRIAL_ZONE:
        mgImage = `/assets/spaceland/planets/small/hk-moon_${String(Math.floor(rng() * 57) + 1).padStart(3, "0")}.png`;
        break;
      case TerrainTypes.RADIATION_STORM: {
        const type = rng() > 0.5 ? "orascrn" : "redscrn";
        mgImage = `/assets/spaceland/terrain/radiation_storms/${type}-${String(Math.floor(rng() * 3) + 1).padStart(3, "0")}.png`;
        break;
      }
    }
  }

  if (mgImage) {
    const mgTexture = await loadTexture(mgImage);
    if (mgTexture) {
      const sprite = new PIXI.Sprite(mgTexture);
      sprite.anchor.set(0.5);
      sprite.x = x;
      sprite.y = y;
      sprite.width = HEX_SIZE * 2;
      sprite.height = HEX_SIZE * 2;
      container.addChild(sprite);
    }
  }

  // Foreground (System assets / Stations)
  let fgImage = "";
  if (planet) {
    const systemIndex = Math.floor(rng() * 10) + 1;
    fgImage = `/assets/spaceland/system/sys${String(systemIndex).padStart(3, "0")}.png`;
  } else if (hex.terrain === TerrainTypes.INDUSTRIAL_ZONE) {
    fgImage = `/assets/spaceland/terrain/industrial_zones/${Math.floor(rng() * 10) + 1}.png`;
  }

  const station = galaxyStore.stationLookup?.get(
    `${hex.location.q},${hex.location.r}`,
  );
  if (station) {
    fgImage = `/assets/spaceland/stations/rs${String(Math.floor(rng() * 16) + 1).padStart(3, "0")}.png`;
  }

  if (fgImage) {
    const fgTexture = await loadTexture(fgImage);
    if (fgTexture) {
      const sprite = new PIXI.Sprite(fgTexture);
      sprite.anchor.set(0.5);
      sprite.x = x;
      sprite.y = y;
      sprite.width = HEX_SIZE * 2;
      sprite.height = HEX_SIZE * 2;
      container.addChild(sprite);
    }
  }
}

function renderUnits() {
  unitContainer.removeChildren();
  if (!mapSettingsStore.showUnits) return;

  for (const unit of galaxyStore.units) {
    const { x, y } = hexToPixel(unit.location.q, unit.location.r, HEX_SIZE);
    const unitX = Math.floor(x - COUNTER_WIDTH / 2) - 4;
    const unitY = Math.floor(y - COUNTER_HEIGHT / 2) - 4;

    const container = new PIXI.Container();
    container.x = unitX;
    container.y = unitY;
    unitContainer.addChild(container);

    const color = getPlayerColor(String(unit.playerId));

    // Background
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, COUNTER_WIDTH, COUNTER_HEIGHT, 4);
    bg.fill({ color: color.background, alpha: 1 });
    bg.stroke({ width: 3, color: color.foreground, alpha: 1 });
    container.addChild(bg);

    // Unit Name
    const unitCatalog = UNIT_CATALOG_ID_MAP.get(unit.catalogId);
    const nameLookup: Record<string, string> = {
      [UnitClasses.BATTLECRUISER]: "B.CRUISER",
      [UnitClasses.LIGHT_CRUISER]: "L.CRUISER",
      [UnitClasses.HEAVY_CRUISER]: "H.CRUISER",
    };
    const text = unitCatalog
      ? nameLookup[unitCatalog.class] ||
        unitCatalog.class.toUpperCase().replace(/_/g, " ")
      : unit.catalogId.toUpperCase();

    const nameText = new PIXI.Text({
      text,
      style: {
        fontSize: 10,
        fontFamily: "monospace",
        fill: color.foreground,
        fontWeight: "bold",
      },
    });
    nameText.x = 4;
    nameText.y = 4;
    container.addChild(nameText);

    // Steps
    unit.steps.forEach((step, index) => {
      const STEP_SIZE = 12;
      const STEP_GAP = 4;
      const stepsPerRow = 4;
      const row = Math.floor(index / stepsPerRow);
      const col = index % stepsPerRow;
      const totalWidth = stepsPerRow * STEP_SIZE + (stepsPerRow - 1) * STEP_GAP;

      const stepX =
        col * (STEP_SIZE + STEP_GAP) + (COUNTER_WIDTH - totalWidth) / 2;
      const stepY =
        row * (STEP_SIZE + STEP_GAP) + (unit.steps.length < 5 ? 28 : 24);

      const stepG = new PIXI.Graphics();
      stepG.roundRect(stepX, stepY, STEP_SIZE, STEP_SIZE, 2);
      if (!step.isSuppressed) {
        stepG.fill({ color: color.foreground, alpha: 1 });
      }
      stepG.stroke({ width: 2, color: color.foreground, alpha: 1 });
      container.addChild(stepG);

      if (step.specialistId) {
        const specialist = SPECIALIST_STEP_ID_MAP.get(step.specialistId);
        const symbol = specialist
          ? SPECIALIST_STEP_SYMBOL_MAP.get(specialist.type)
          : "";
        const textColor = step.isSuppressed
          ? color.foreground
          : color.background;

        const specText = new PIXI.Text({
          text: symbol || "",
          style: {
            fontSize: 10,
            fontFamily: "monospace",
            fill: textColor,
            fontWeight: "bold",
          },
        });
        specText.anchor.set(0.5);
        specText.x = stepX + STEP_SIZE / 2;
        specText.y = stepY + STEP_SIZE / 2;
        container.addChild(specText);
      }
    });

    // MP
    const mpText = new PIXI.Text({
      text: `${unit.state.mp}`,
      style: {
        fontSize: 10,
        fontFamily: "monospace",
        fill: color.foreground,
        fontWeight: "bold",
      },
    });
    mpText.x = 5;
    mpText.y = COUNTER_HEIGHT - 15;
    container.addChild(mpText);

    // AP
    const apText = new PIXI.Text({
      text: "⚡".repeat(unit.state.ap),
      style: {
        fontSize: 12,
        fontFamily: "monospace",
        fill: color.foreground,
        fontWeight: "bold",
      },
    });
    apText.x = COUNTER_WIDTH - (unit.state.ap > 1 ? 24 : 16);
    apText.y = COUNTER_HEIGHT - 18;
    container.addChild(apText);
  }
}

function renderSelection() {
  selectionContainer.removeChildren();
  const hex = galaxyStore.selectedHex;
  if (!hex) return;

  const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
  const g = new PIXI.Graphics();

  const angle = Math.PI / 3;
  const offset = -Math.PI / 6; // Rotate by 30 degrees to make it pointy-top
  const points = [];
  for (let i = 0; i < 6; i++) {
    points.push(
      x + (HEX_SIZE - 4) * Math.cos(i * angle + offset),
      y + (HEX_SIZE - 4) * Math.sin(i * angle + offset),
    );
  }
  g.poly(points, true);
  g.stroke({ width: 4, color: 0xffffff, alpha: 1 });
  selectionContainer.addChild(g);
}

async function renderMap() {
  if (!viewport) return;

  hexGraphicsContainer.removeChildren();
  const g = new PIXI.Graphics();
  hexGraphicsContainer.addChild(g);

  if (!mapSettingsStore.showHexGraphics) {
    // Abstract View
    for (const hex of galaxyStore.hexes) {
      const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);

      let fill = null;
      let stroke = 0x444444;
      let opacity = 0.4;

      if (hex.planetId) {
        stroke = 0xffffff;
        opacity = 0.8;
      }

      if (
        galaxyStore.validSpawnLocations &&
        galaxyStore.validSpawnLocations.get(
          String(HexUtils.getCoordsID(hex.location)),
        )
      ) {
        opacity = 0.45;
      }

      const color = getPlayerColor(String(hex.playerId));
      if (hex.playerId) {
        fill = color.background;
        stroke = color.background;
      }

      drawHexagon(g, x, y, HEX_SIZE - 2, fill, stroke, 4, opacity);

      // Add text for abstract view
      let textContent = "";
      switch (hex.terrain) {
        case TerrainTypes.ASTEROID_FIELD:
          textContent = "◌";
          break;
        case TerrainTypes.DEBRIS_FIELD:
          textContent = "⦼";
          break;
        case TerrainTypes.GAS_CLOUD:
          textContent = "⩯";
          break;
        case TerrainTypes.GRAVITY_WELL:
          textContent = "⧨";
          break;
        case TerrainTypes.INDUSTRIAL_ZONE:
          textContent = "⛋";
          break;
        case TerrainTypes.NEBULA:
          textContent = "≈";
          break;
        case TerrainTypes.RADIATION_STORM:
          textContent = "☢";
          break;
      }

      if (hex.planetId != null) {
        const planet = galaxyStore.planetLookup!.get(
          String(HexUtils.getCoordsID(hex.location)),
        );
        textContent = planet?.isCapital ? "✫" : "⦲";
      }

      if (textContent) {
        const text = new PIXI.Text({
          text: textContent,
          style: {
            fill: hex.playerId ? color.foreground : 0xffffff,
            fontSize: 40,
          },
        });
        text.anchor.set(0.5);
        text.x = x;
        text.y = y;
        hexGraphicsContainer.addChild(text);
      }

      if (hex.stationId != null) {
        const stationText = new PIXI.Text({
          text: "⏣",
          style: {
            fill: hex.playerId ? color.foreground : 0xffffff,
            fontSize: 30,
          },
        });
        stationText.anchor.set(0.5);
        stationText.x = x;
        stationText.y = y - 20;
        hexGraphicsContainer.addChild(stationText);
      }
    }
  } else {
    // Graphical View
    const graphicalHexContainer = new PIXI.Container();
    hexGraphicsContainer.addChild(graphicalHexContainer);

    // Kick off all renders
    const renderPromises = galaxyStore.hexes.map((hex) =>
      renderGraphicalHex(hex, graphicalHexContainer),
    );
    await Promise.all(renderPromises);

    // Also draw borders in graphical view
    for (const hex of galaxyStore.hexes) {
      if (hex.playerId) {
        const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
        const color = getPlayerColor(String(hex.playerId));
        drawHexagon(
          g,
          x,
          y,
          HEX_SIZE - 2,
          color.background,
          color.background,
          4,
          0.1,
        );
      }
    }
  }

  renderUnits();
  renderSelection();
}

onMounted(async () => {
  if (!pixiContainer.value) return;

  app = new PIXI.Application();
  await app.init({
    width: mapSettingsStore.stage.width,
    height: mapSettingsStore.stage.height,
    antialias: true,
    backgroundAlpha: 0,
    resizeTo: pixiContainer.value,
  });

  pixiContainer.value.appendChild(app.canvas);

  // create viewport
  viewport = new Viewport({
    screenWidth: mapSettingsStore.stage.width,
    screenHeight: mapSettingsStore.stage.height,
    worldWidth: 10000,
    worldHeight: 10000,
    events: app.renderer.events,
  });

  app.stage.addChild(viewport);
  viewport.addChild(hexGraphicsContainer);
  viewport.addChild(unitContainer);
  viewport.addChild(selectionContainer);

  viewport.drag().pinch().wheel().decelerate();

  // Sync viewport with store
  viewport.on("moved", () => {
    mapSettingsStore.stage.x = viewport!.x;
    mapSettingsStore.stage.y = viewport!.y;
    mapSettingsStore.stage.scale = viewport!.scale.x;
  });

  // Set initial position
  // viewport.setTransform(
  //   mapSettingsStore.stage.x,
  //   mapSettingsStore.stage.y,
  //   mapSettingsStore.stage.scale,
  //   mapSettingsStore.stage.scale
  // );

  viewport.on("clicked", (e) => {
    if (mapSettingsStore.isPinching) return;

    const worldPos = viewport!.toWorld(e.screen);
    const { q, r } = pixelToHex(worldPos.x, worldPos.y, HEX_SIZE);

    const hex = galaxyStore.getHex(q, r);
    if (hex) {
      if (movementStore.isMoveMode) {
        movementStore.addHexToPath(hex);
      } else if (combatStore.isAttackMode) {
        const unit = galaxyStore.units.find(
          (u) =>
            u.location.q === hex.location.q && u.location.r === hex.location.r,
        );
        if (unit) {
          const isValid = combatStore.validTargetHexes.some(
            (targetHex: any) => targetHex._id === hex._id,
          );
          if (isValid) {
            combatStore.setTarget(unit);
          }
        }
      } else {
        galaxyStore.selectHex(hex);
      }
    }
  });

  renderMap();
});

onUnmounted(() => {
  if (app) {
    app.destroy(true, { children: true, texture: true });
  }
});

// Watch for changes that require re-rendering
watch(
  [
    () => galaxyStore.hexes,
    () => galaxyStore.units,
    () => galaxyStore.selectedHex,
    () => mapSettingsStore.showHexGraphics,
    () => mapSettingsStore.showUnits,
  ],
  () => {
    renderMap();
  },
  { deep: true },
);

// Provide the PIXI app and viewport to sub-components if needed
provide("pixiApp", app);
provide("pixiViewport", viewport);
</script>

<style scoped>
.pixi-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
