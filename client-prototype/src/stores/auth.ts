import { defineStore } from "pinia";
import axios from "axios";

interface User {
  _id: string;
  username: string;
  email: string;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("auth_token") || (null as string | null),
    user: JSON.parse(
      localStorage.getItem("auth_user") || "null",
    ) as User | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async loginGoogle(idToken: string) {
      try {
        const response = await axios.post("/api/v1/auth/google", {
          idToken,
        });
        const { token, user } = response.data;

        this.token = token;
        this.user = user;

        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));

        // Set default header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        return true;
      } catch (error) {
        console.error("Google login failed", error);
        return false;
      }
    },
    async loginDiscord(code: string) {
      try {
        const response = await axios.post("/api/v1/auth/discord", {
          code,
        });
        const { token, user } = response.data;

        this.token = token;
        this.user = user;

        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));

        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        return true;
      } catch (error) {
        console.error("Discord login failed", error);
        return false;
      }
    },
    async loginDev(username: string, email: string) {
      try {
        const response = await axios.post("/api/v1/auth/dev", {
          username,
          email,
        });
        const { token, user } = response.data;

        this.token = token;
        this.user = user;

        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));

        // Set default header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        return true;
      } catch (error) {
        console.error("Login failed", error);
        return false;
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      delete axios.defaults.headers.common["Authorization"];
    },
    initialize() {
      if (this.token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;
      }
    },
  },
});
