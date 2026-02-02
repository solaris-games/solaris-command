import { defineStore } from "pinia";
import { hexToPixel } from "../utils/hexUtils";

const HEX_SIZE = 64;

export const useMapSettingsStore = defineStore("mapSettings", {
  state: () => ({
    showHexGraphics: false,
    showHexCoordinates: false,
    showUnits: true,
    showSupply: false,
    showZOC: false,
    showMPCosts: false,
    isPinching: false,
    stage: {
      width: 0,
      height: 0,
      scale: 1,
      x: 0,
      y: 0,
    },
  }),
  actions: {
    toggleHexGraphics() {
      this.showHexGraphics = !this.showHexGraphics;
    },
    toggleHexCoordinates() {
      this.showHexCoordinates = !this.showHexCoordinates;
    },
    toggleUnits() {
      this.showUnits = !this.showUnits;
    },
    toggleSupply() {
      this.showSupply = !this.showSupply;
    },
    toggleZOC() {
      this.showZOC = !this.showZOC;
    },
    toggleMPCosts() {
      this.showMPCosts = !this.showMPCosts;
    },
    centerOnHex(q: number, r: number) {
      if (!this.stage.width || !this.stage.height) return;

      const { x, y } = hexToPixel(q, r, HEX_SIZE);
      this.stage.x = -x * this.stage.scale + this.stage.width / 2;
      this.stage.y = -y * this.stage.scale + this.stage.height / 2;
    },
  },
});
