import { defineStore } from "pinia";

export const useMapSettingsStore = defineStore("mapSettings", {
  state: () => ({
    showPlayerColors: true,
    showSupply: false,
    showZOC: false,
  }),
  actions: {
    togglePlayerColors() {
      this.showPlayerColors = !this.showPlayerColors;
    },
    toggleSupply() {
      this.showSupply = !this.showSupply;
    },
    toggleZOC() {
      this.showZOC = !this.showZOC;
    },
  },
});
