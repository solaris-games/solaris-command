import { defineStore } from "pinia";

export const useMapSettingsStore = defineStore("mapSettings", {
  state: () => ({
    showHexGraphics: false,
    showHexCoordinates: false,
    showSupply: false,
    showZOC: false,
    showMPCosts: false
  }),
  actions: {
    toggleHexGraphics() {
      this.showHexGraphics = !this.showHexGraphics;
    },
    toggleHexCoordinates() {
      this.showHexCoordinates = !this.showHexCoordinates;
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
  },
});
