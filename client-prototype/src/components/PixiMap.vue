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
import { MapUtils } from "@solaris-command/core/src/utils/map-utils";
import { SupplyEngine } from "@solaris-command/core/src/utils/supply-engine";
import { CombatOperation } from "@solaris-command/core/src/types/combat";
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
const territoryContainer = new PIXI.Container();
const visionContainer = new PIXI.Container();
const movementContainer = new PIXI.Container();
const movementInteractionContainer = new PIXI.Container();
const attackContainer = new PIXI.Container();
const attackInteractionContainer = new PIXI.Container();
const unitContainer = new PIXI.Container();
const supplyContainer = new PIXI.Container();
const zocContainer = new PIXI.Container();
const mpCostsContainer = new PIXI.Container();
const hexCoordinatesContainer = new PIXI.Container();
const selectionContainer = new PIXI.Container();

const HEX_SIZE = 64;
const HEX_WIDTH = HEX_SIZE * Math.sqrt(3);
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

function getHexCorner(x: number, y: number, size: number, i: number) {
  const angle = Math.PI / 3;
  const offset = -Math.PI / 6;
  return {
    x: x + size * Math.cos(i * angle + offset),
    y: y + size * Math.sin(i * angle + offset),
  };
}

function drawDashedLine(
  graphics: PIXI.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dash: number = 10,
  gap: number = 5,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const normalX = dx / len;
  const normalY = dy / len;

  let progress = 0;
  while (progress < len) {
    const startX = x1 + normalX * progress;
    const startY = y1 + normalY * progress;

    progress = Math.min(progress + dash, len);

    graphics.moveTo(startX, startY);
    graphics.lineTo(x1 + normalX * progress, y1 + normalY * progress);

    progress += gap;
  }
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
  const points = [];
  for (let i = 0; i < 6; i++) {
    const corner = getHexCorner(x, y, size, i);
    points.push(corner.x, corner.y);
  }

  g.beginPath();
  g.poly(points, true);

  if (fill !== null) {
    g.fill({ color: fill, alpha: opacity });
  }

  g.stroke({ width: strokeWidth, color: stroke, alpha: 0.2 });
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

function drawArrowPath(
  g: PIXI.Graphics,
  points: { x: number; y: number }[],
  options: {
    width: number;
    color: number;
    headLength: number;
    headAngle: number;
    factor: number;
  },
) {
  if (points.length < 2) return;

  g.beginPath();
  // Draw line through all points except the last one
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    g.lineTo(points[i].x, points[i].y);
  }

  // Draw the arrow segment (last segment shortened to 70% of its length)
  const p1 = points[points.length - 2];
  const p2 = points[points.length - 1];

  const arrowX = p1.x + (p2.x - p1.x) * options.factor;
  const arrowY = p1.y + (p2.y - p1.y) * options.factor;

  g.lineTo(arrowX, arrowY);

  // Draw the arrow head at (arrowX, arrowY)
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

  g.moveTo(arrowX, arrowY);
  g.lineTo(
    arrowX - options.headLength * Math.cos(angle - options.headAngle),
    arrowY - options.headLength * Math.sin(angle - options.headAngle),
  );
  g.moveTo(arrowX, arrowY);
  g.lineTo(
    arrowX - options.headLength * Math.cos(angle + options.headAngle),
    arrowY - options.headLength * Math.sin(angle + options.headAngle),
  );

  g.stroke({
    width: options.width,
    color: options.color,
    cap: "round",
    join: "round",
  });
}

function renderMovement() {
  movementContainer.removeChildren();

  const g = new PIXI.Graphics();
  movementContainer.addChild(g);

  for (const unit of galaxyStore.units) {
    if (
      !unit.movement ||
      !unit.movement.path ||
      unit.movement.path.length === 0
    )
      continue;

    const points: { x: number; y: number }[] = [];
    const startPixel = hexToPixel(unit.location.q, unit.location.r, HEX_SIZE);
    points.push(startPixel);

    for (const pathHexCoords of unit.movement.path) {
      const pixel = hexToPixel(pathHexCoords.q, pathHexCoords.r, HEX_SIZE);
      points.push(pixel);
    }

    drawArrowPath(g, points, {
      width: 12,
      color: 0xffffff,
      headLength: 24,
      headAngle: Math.PI / 6,
      factor: 0.8,
    });
  }
}

function renderMovementInteraction() {
  movementInteractionContainer.removeChildren();
  if (!movementStore.isMoveMode) return;

  const g = new PIXI.Graphics();
  movementInteractionContainer.addChild(g);

  // Highlight reachable hexes
  for (const hex of movementStore.reachableHexes) {
    const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
    const points = [];
    for (let i = 0; i < 6; i++) {
      const corner = getHexCorner(x, y, HEX_SIZE, i);
      points.push(corner.x, corner.y);
    }
    g.beginPath();
    g.poly(points, true);
    g.stroke({ width: 8, color: 0xffffff });
  }

  // Draw movement path
  if (movementStore.startHex && movementStore.movementPath.length) {
    const points = [movementStore.startHex, ...movementStore.movementPath].map(
      (hex) => hexToPixel(hex.location.q, hex.location.r, HEX_SIZE),
    );

    drawArrowPath(g, points, {
      width: 12,
      color: 0xffffff,
      headLength: 24,
      headAngle: Math.PI / 6,
      factor: 0.8,
    });
  }
}

function drawAttackArrow(
  g: PIXI.Graphics,
  start: { x: number; y: number },
  end: { x: number; y: number },
  operation: CombatOperation,
) {
  // Vector from start to end
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return;

  const unitDx = dx / length;
  const unitDy = dy / length;

  // Shorten the arrow to not go into the center of the hex
  const arrowOffset = HEX_SIZE / 2 + 15;
  const shorterEndPixel = {
    x: end.x - unitDx * arrowOffset,
    y: end.y - unitDy * arrowOffset,
  };

  // Perpendicular vector for offset
  const pdx = -unitDy;
  const pdy = unitDx;
  const offset = 15;

  const drawArrow = (sx: number, sy: number, ex: number, ey: number) => {
    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(ex, ey);

    const angle = Math.atan2(ey - sy, ex - sx);
    const headLength = 15;
    const headAngle = Math.PI / 6;

    g.moveTo(ex, ey);
    g.lineTo(
      ex - headLength * Math.cos(angle - headAngle),
      ey - headLength * Math.sin(angle - headAngle),
    );
    g.moveTo(ex, ey);
    g.lineTo(
      ex - headLength * Math.cos(angle + headAngle),
      ey - headLength * Math.sin(angle + headAngle),
    );

    g.stroke({
      width: 6,
      color: 0xffffff,
      cap: "round",
      join: "round",
    });
  };

  const hasCenter = operation !== CombatOperation.SUPPRESSIVE_FIRE;
  const hasSides = operation !== CombatOperation.FEINT;

  if (hasCenter) {
    drawArrow(start.x, start.y, shorterEndPixel.x, shorterEndPixel.y);
  }

  if (hasSides) {
    // Left arrow
    drawArrow(
      start.x - pdx * offset,
      start.y - pdy * offset,
      shorterEndPixel.x - pdx * offset,
      shorterEndPixel.y - pdy * offset,
    );
    // Right arrow
    drawArrow(
      start.x + pdx * offset,
      start.y + pdy * offset,
      shorterEndPixel.x + pdx * offset,
      shorterEndPixel.y + pdy * offset,
    );
  }
}

function renderAttacks() {
  attackContainer.removeChildren();

  const g = new PIXI.Graphics();
  attackContainer.addChild(g);

  for (const unit of galaxyStore.units) {
    if (!unit.combat || !unit.combat.location) continue;

    const startPixel = hexToPixel(unit.location.q, unit.location.r, HEX_SIZE);
    const endPixel = hexToPixel(
      unit.combat.location.q,
      unit.combat.location.r,
      HEX_SIZE,
    );

    drawAttackArrow(g, startPixel, endPixel, unit.combat.operation as any);
  }
}

function renderAttackInteraction() {
  attackInteractionContainer.removeChildren();
  if (!combatStore.isAttackMode) return;

  const g = new PIXI.Graphics();
  attackInteractionContainer.addChild(g);

  const selectedUnit = galaxyStore.selectedUnit;
  if (!selectedUnit) return;

  const color = getPlayerColor(String(selectedUnit.playerId));

  // Highlight valid target hexes
  for (const hex of combatStore.validTargetHexes) {
    const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
    const points = [];
    for (let i = 0; i < 6; i++) {
      const corner = getHexCorner(x, y, HEX_SIZE - 2, i);
      points.push(corner.x, corner.y);
    }
    g.beginPath();
    g.poly(points, true);
    // Draw dashed-like stroke (PIXI doesn't have native dashed lines easily,
    // but we can use a simpler solid highlight for now or find a workaround if needed)
    g.stroke({ width: 4, color: color.background, alpha: 0.4 });
    g.fill({ color: color.background });
  }

  // Highlight selected target
  if (combatStore.targetUnit) {
    const targetHex = galaxyStore.getHex(
      combatStore.targetUnit.location.q,
      combatStore.targetUnit.location.r,
    );
    if (targetHex) {
      const { x, y } = hexToPixel(
        targetHex.location.q,
        targetHex.location.r,
        HEX_SIZE,
      );
      const points = [];
      for (let i = 0; i < 6; i++) {
        const corner = getHexCorner(x, y, HEX_SIZE - 2, i);
        points.push(corner.x, corner.y);
      }
      g.beginPath();
      g.poly(points, true);
      g.stroke({ width: 6, color: color.background, alpha: 0.6 });

      // Draw attack arrow for current interaction
      const startPixel = hexToPixel(
        selectedUnit.location.q,
        selectedUnit.location.r,
        HEX_SIZE,
      );
      const endPixel = { x, y };
      drawAttackArrow(g, startPixel, endPixel, combatStore.selectedOperation);
    }
  }
}

function renderUnits() {
  unitContainer.removeChildren();

  for (const unit of galaxyStore.units) {
    const { x, y } = hexToPixel(unit.location.q, unit.location.r, HEX_SIZE);
    const unitX = Math.floor(x - COUNTER_WIDTH / 2);
    const unitY = Math.floor(y - COUNTER_HEIGHT / 2);

    const container = new PIXI.Container();
    container.x = unitX;
    container.y = unitY;
    unitContainer.addChild(container);

    const color = getPlayerColor(String(unit.playerId));

    // Background
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, COUNTER_WIDTH, COUNTER_HEIGHT, 4);
    bg.fill({ color: color.background });

    if (unit.supply?.isInSupply !== false) {
      bg.stroke({ width: 3, color: color.foreground });
    } else {
      // Draw dashed border for out of supply units
      bg.beginPath();
      const dash = 10;
      const gap = 5;
      // Top
      drawDashedLine(bg, 0, 0, COUNTER_WIDTH, 0, dash, gap);
      // Right
      drawDashedLine(
        bg,
        COUNTER_WIDTH,
        0,
        COUNTER_WIDTH,
        COUNTER_HEIGHT,
        dash,
        gap,
      );
      // Bottom
      drawDashedLine(
        bg,
        COUNTER_WIDTH,
        COUNTER_HEIGHT,
        0,
        COUNTER_HEIGHT,
        dash,
        gap,
      );
      // Left
      drawDashedLine(bg, 0, COUNTER_HEIGHT, 0, 0, dash, gap);
      bg.stroke({ width: 3, color: color.foreground });
    }
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
      resolution: 2,
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
        stepG.fill({ color: color.foreground });
      }
      stepG.stroke({ width: 2, color: color.foreground });
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
          resolution: 2,
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
      resolution: 2,
    });
    mpText.x = 5;
    mpText.y = COUNTER_HEIGHT - 15;
    container.addChild(mpText);

    // AP
    const apText = new PIXI.Text({
      text: "⚡".repeat(unit.state.ap),
      style: {
        fontSize: 14,
        fontFamily: "monospace",
        fill: color.foreground,
        fontWeight: "bold",
      },
      resolution: 2,
    });
    apText.x = COUNTER_WIDTH - (unit.state.ap > 1 ? 24 : 16);
    apText.y = COUNTER_HEIGHT - 18;
    container.addChild(apText);
  }
}

function renderBorders() {
  territoryContainer.removeChildren();
  if (!galaxyStore.hexes || !galaxyStore.players) return;

  const g = new PIXI.Graphics();
  territoryContainer.addChild(g);

  const playerTerritories = new Map<string, any[]>();
  for (const hex of galaxyStore.hexes) {
    if (hex.playerId) {
      const pId = String(hex.playerId);
      if (!playerTerritories.has(pId)) {
        playerTerritories.set(pId, []);
      }
      playerTerritories.get(pId)!.push(hex);
    }
  }

  for (const [playerId, territoryHexes] of playerTerritories.entries()) {
    const color = getPlayerColor(playerId);
    const territoryHexIds = new Set(
      territoryHexes.map((h) => String(HexUtils.getCoordsID(h.location))),
    );

    g.beginPath();
    for (const hex of territoryHexes) {
      const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);

      for (let i = 0; i < 6; i++) {
        const neighbor = HexUtils.neighbor(hex.location, i);
        const neighborId = HexUtils.getCoordsID(neighbor);

        if (!territoryHexIds.has(String(neighborId))) {
          const directionToCorners = [
            [0, 1], // NE
            [5, 0], // E-ish
            [4, 5], // SE
            [3, 4], // SW
            [2, 3], // W-ish
            [1, 2], // NW
          ];
          const [c1_idx, c2_idx] = directionToCorners[i];
          const p1 = getHexCorner(x, y, HEX_SIZE - 2, c1_idx);
          const p2 = getHexCorner(x, y, HEX_SIZE - 2, c2_idx);

          g.moveTo(p1.x, p1.y);
          g.lineTo(p2.x, p2.y);
        }
      }
    }
    g.stroke({
      width: 6,
      color: color.background,
      cap: "round",
      join: "round",
    });
  }
}

function renderVisionRange() {
  visionContainer.removeChildren();
  if (!galaxyStore.hexes) return;

  const g = new PIXI.Graphics();
  visionContainer.addChild(g);

  const visionMap = new Map<string, boolean>();
  for (const hex of galaxyStore.hexes) {
    visionMap.set(String(HexUtils.getCoordsID(hex.location)), !!hex.isInVisionRange);
  }

  g.beginPath();
  for (const hex of galaxyStore.hexes) {
    if (!hex.isInVisionRange) continue;

    const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);

    for (let i = 0; i < 6; i++) {
      const neighbor = HexUtils.neighbor(hex.location, i);
      const neighborId = HexUtils.getCoordsID(neighbor);

      if (!visionMap.get(String(neighborId))) {
        const directionToCorners = [
          [0, 1], // NE
          [5, 0], // E-ish
          [4, 5], // SE
          [3, 4], // SW
          [2, 3], // W-ish
          [1, 2], // NW
        ];
        const [c1_idx, c2_idx] = directionToCorners[i];
        const p1 = getHexCorner(x, y, HEX_SIZE, c1_idx);
        const p2 = getHexCorner(x, y, HEX_SIZE, c2_idx);

        g.moveTo(p1.x, p1.y);
        g.lineTo(p2.x, p2.y);
      }
    }
  }
  g.stroke({
    width: 2,
    color: 0xffffff,
    alpha: 0.2,
    cap: "round",
    join: "round",
  });
}

function renderSupply() {
  supplyContainer.removeChildren();

  if (!galaxyStore.players) {
    return;
  }

  for (const player of galaxyStore.players) {
    const supplyNetwork = SupplyEngine.calculatePlayerSupplyNetwork(
      player._id,
      galaxyStore.hexes,
      galaxyStore.planets,
      galaxyStore.stations,
    );

    const color = getPlayerColor(String(player._id));

    for (const [id, remainingMP] of supplyNetwork) {
      const hex = galaxyStore.hexes.find(
        (h) => HexUtils.getCoordsID(h.location) === id,
      );

      if (!hex) continue;

      const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);

      // Supply Circle
      const circle = new PIXI.Graphics();
      circle.circle(x, y, 0.3 * HEX_WIDTH);
      circle.fill({ color: color.background });
      circle.stroke({
        width: 4,
        color: color.foreground,
      });
      supplyContainer.addChild(circle);

      // Supply Text
      const text = new PIXI.Text({
        text: remainingMP.toString(),
        style: {
          fontSize: 32,
          fontFamily: "monospace",
          fontWeight: "bold",
          fill: color.foreground,
        },
        resolution: 2,
      });
      text.anchor.set(0.5);
      text.x = x;
      text.y = y;
      supplyContainer.addChild(text);
    }
  }
}

function renderZOC() {
  zocContainer.removeChildren();

  for (const hex of galaxyStore.hexes) {
    if (hex.zoc && hex.zoc.length) {
      const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);

      const circle = new PIXI.Graphics();
      circle.circle(x, y, 0.2 * HEX_WIDTH);
      circle.fill({ color: 0xffffff });
      circle.stroke({
        width: 6,
        color: 0x000000,
      });
      zocContainer.addChild(circle);
    }
  }
}

function renderMPCosts() {
  mpCostsContainer.removeChildren();

  for (const hex of galaxyStore.hexes) {
    if (MapUtils.isHexImpassable(hex as any)) continue;

    const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);
    const mpCost = MapUtils.getHexMPCost(
      hex as any,
      galaxyStore.currentPlayerId as any,
      true,
    );

    // Circle
    const circle = new PIXI.Graphics();
    circle.circle(x, y, 0.2 * HEX_WIDTH);
    circle.fill({ color: 0xffffff });
    circle.stroke({
      width: 4,
      color: 0x000000,
    });
    mpCostsContainer.addChild(circle);

    // Cost Text
    const text = new PIXI.Text({
      text: mpCost.toString(),
      style: {
        fontSize: 32,
        fontFamily: "monospace",
        fontWeight: "bold",
        fill: 0x000000,
      },
      resolution: 2,
    });
    text.anchor.set(0.5);
    text.x = x;
    text.y = y;
    mpCostsContainer.addChild(text);
  }
}

function renderHexCoordinates() {
  hexCoordinatesContainer.removeChildren();

  for (const hex of galaxyStore.hexes) {
    const { x, y } = hexToPixel(hex.location.q, hex.location.r, HEX_SIZE);

    const text = new PIXI.Text({
      text: `${hex.location.q},${hex.location.r}`,
      style: {
        fontSize: 12,
        fontFamily: "monospace",
        fill: 0xffffff,
      },
      resolution: 2,
    });
    text.anchor.set(0.5);
    text.x = x;
    text.y = y + HEX_SIZE - 16;
    hexCoordinatesContainer.addChild(text);
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
      x + HEX_SIZE * Math.cos(i * angle + offset),
      y + HEX_SIZE * Math.sin(i * angle + offset),
    );
  }
  g.beginPath();
  g.poly(points, true);
  g.stroke({ width: 4, color: 0xffffff });
  selectionContainer.addChild(g);
}

async function renderMap() {
  if (!viewport) return;

  hexGraphicsContainer.removeChildren();
  const g = new PIXI.Graphics();
  hexGraphicsContainer.addChild(g);

  if (!mapSettingsStore.showHexGraphics) {
    const hatchTexture = await loadTexture("/assets/hatch.png");
    if (hatchTexture) {
      hatchTexture.source.addressMode = "repeat";
    }

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
        opacity = 0.5;
      }

      const color = getPlayerColor(String(hex.playerId));
      if (hex.playerId) {
        fill = color.background;
        stroke = color.background;
      }

      drawHexagon(g, x, y, HEX_SIZE - 2, fill, stroke, 4, opacity);

      // Supply Hatch Overlay
      // Visible only if the hex is owned by a player
      // and the hex is out of supply.
      if (hex.playerId != null) {
        const coordsId = HexUtils.getCoordsID(hex.location);
        const isOutOfSupply =
          galaxyStore.allPlayersSupplyNetwork &&
          !galaxyStore.allPlayersSupplyNetwork.has(coordsId);

        if (isOutOfSupply && hatchTexture) {
          const points = [];
          for (let i = 0; i < 6; i++) {
            const corner = getHexCorner(x, y, HEX_SIZE - 2, i);
            points.push(corner.x, corner.y);
          }
          g.poly(points, true);
          g.fill({ texture: hatchTexture, alpha: 0.5 });
        }
      }

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
            fontSize: 60,
          },
          resolution: 2,
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
            fontSize: 50,
          },
          resolution: 2,
        });
        stationText.anchor.set(0.5);
        stationText.x = x;
        stationText.y = y - 45;
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
          0,
          0.1,
        );
      }
    }
  }

  renderBorders();
  renderVisionRange();
  renderMovement();
  renderMovementInteraction();
  renderUnits();
  renderAttacks();
  renderAttackInteraction();
  renderSupply();
  renderZOC();
  renderMPCosts();
  renderHexCoordinates();
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
    resolution: window.devicePixelRatio || 2,
    autoDensity: true,
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

  mapSettingsStore.viewport = viewport;

  app.stage.addChild(viewport);
  viewport.addChild(hexGraphicsContainer);
  viewport.addChild(territoryContainer);
  viewport.addChild(visionContainer);
  viewport.addChild(movementContainer);
  viewport.addChild(movementInteractionContainer);
  viewport.addChild(attackContainer);
  viewport.addChild(attackInteractionContainer);
  viewport.addChild(unitContainer);
  viewport.addChild(supplyContainer);
  viewport.addChild(zocContainer);
  viewport.addChild(mpCostsContainer);
  viewport.addChild(hexCoordinatesContainer);
  viewport.addChild(selectionContainer);

  // Set initial visibility based on settings
  unitContainer.visible = mapSettingsStore.showUnits;
  movementContainer.visible = mapSettingsStore.showUnits;
  attackContainer.visible = mapSettingsStore.showUnits;
  supplyContainer.visible = mapSettingsStore.showSupply;
  zocContainer.visible = mapSettingsStore.showZOC;
  mpCostsContainer.visible = mapSettingsStore.showMPCosts;
  hexCoordinatesContainer.visible = mapSettingsStore.showHexCoordinates;

  viewport.drag().pinch().wheel().decelerate({ friction: 0.88 });

  // Sync viewport with store
  viewport.on("moved", () => {
    mapSettingsStore.stage.x = viewport!.x;
    mapSettingsStore.stage.y = viewport!.y;
    mapSettingsStore.stage.scale = viewport!.scale.x;
  });

  // Set initial position
  const center = hexToPixel(0, 0, HEX_SIZE);
  viewport.moveCenter(center.x, center.y);
  viewport.scale.set(0.8); // zoom out slightly to see more of the map

  viewport.on("clicked", (e) => {
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

  mapSettingsStore.viewport = null;
});

// Main map re-render (Hexes and general structure)
watch(
  [
    () => galaxyStore.hexes,
    () => mapSettingsStore.showHexGraphics,
    () => galaxyStore.allPlayersSupplyNetwork,
  ],
  () => {
    renderMap();
  },
  { deep: true },
);

// Units and Attacks
watch(
  () => galaxyStore.units,
  () => {
    renderUnits();
    renderMovement();
    renderAttacks();
  },
  { deep: true },
);

// Selection
watch(
  () => galaxyStore.selectedHex,
  () => {
    renderSelection();
  },
);

// Movement
watch(
  [
    () => movementStore.isMoveMode,
    () => movementStore.reachableHexes,
    () => movementStore.movementPath,
  ],
  () => {
    renderMovementInteraction();
  },
  { deep: true },
);

// Combat
watch(
  [
    () => combatStore.isAttackMode,
    () => combatStore.validTargetHexes,
    () => combatStore.targetUnit,
    () => combatStore.selectedOperation,
  ],
  () => {
    renderAttackInteraction();
  },
  { deep: true },
);

watch(
  () => mapSettingsStore.showUnits,
  (val) => {
    unitContainer.visible = val;
    movementContainer.visible = val;
    attackContainer.visible = val;
  },
);

watch(
  () => mapSettingsStore.showSupply,
  (val) => {
    supplyContainer.visible = val;
  },
);

watch(
  () => mapSettingsStore.showZOC,
  (val) => {
    zocContainer.visible = val;
  },
);

watch(
  () => mapSettingsStore.showMPCosts,
  (val) => {
    mpCostsContainer.visible = val;
  },
);

watch(
  () => mapSettingsStore.showHexCoordinates,
  (val) => {
    hexCoordinatesContainer.visible = val;
  },
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
