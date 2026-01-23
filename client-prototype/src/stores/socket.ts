import { defineStore } from "pinia";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "./auth";
import { useGalaxyStore } from "./galaxy";

export const useSocketStore = defineStore("socket", {
  state: () => ({
    socket: null as Socket | null,
    isConnected: false,
  }),
  actions: {
    connect(gameId: string) {
      const authStore = useAuthStore();
      const galaxyStore = useGalaxyStore();

      if (!authStore.token) {
        console.error("Socket: No auth token found.");
        return;
      }

      // Disconnect any existing socket
      if (this.socket) {
        this.disconnect();
      }

      const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      this.socket = io(socketUrl, {
        auth: {
          token: authStore.token,
        },
      });

      this.socket.on("connect", () => {
        this.isConnected = true;
        console.log("Socket: Connected with ID", this.socket?.id);

        // Join the game room
        this.socket?.emit("JOIN_GAME", gameId);
      });

      this.socket.on("disconnect", () => {
        this.isConnected = false;
        console.log("Socket: Disconnected");
      });

      this.socket.on("connect_error", (err: Error) => {
        console.error("Socket: Connection error", err.message);
      });

      this.socket.on("GAME_JOINED", (data: { gameId: string }) => {
        console.log("Socket: Joined game room", data.gameId);
      });

      // Listen for game-specific events
      this.socket.on("TICK_COMPLETED", () => {
        console.log("Socket: TICK_COMPLETED received, reloading galaxy...");
        galaxyStore.fetchGalaxy(gameId);
      });

      // TODO: Implement other websocket events.
    },
    disconnect() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.isConnected = false;
      }
    },
  },
});
