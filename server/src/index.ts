import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";

const compression = require("compression");

import { GameLoop } from "./cron/game-loop";
import { connectToDb } from "./db";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import gameRoutes from "./routes/games";
import unitRoutes from "./routes/units";
import stationRoutes from "./routes/stations";
import playerRoutes from "./routes/players";
import chatRoutes from "./routes/chat";
import { CreateGameJob } from "./cron/create-game";
import { initSocket } from "./socket";
import { ALLOWED_ORIGINS } from "./config/cors";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

// ----- CORS -----
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const isAllowed = ALLOWED_ORIGINS.some((allowedOrigin) => {
        if (typeof allowedOrigin === "string") {
          return origin === allowedOrigin;
        }
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS not allowed"), false);
      }
    },
    credentials: true,
  }),
);
// ----------

app.use(express.json());
app.use(compression());

async function startServer() {
  try {
    // 1. Connect to MongoDB

    /*
    Note: The server uses transactions and MongoDB must be setup with a Replication Set configured.
    Edit the `mongod.conf` file and append this to it:

    replication:
      replSetName: "rs0"

    Then, restart the Mongod service and inside `mongosh`, run:

    rs.initiate()
    */

    await connectToDb();

    // 2. Start cron jobs
    GameLoop.start();
    CreateGameJob.start();

    // 3. Start Express + Socket.IO
    initSocket(httpServer);

    httpServer.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });

    // Routes
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/users", userRoutes);
    app.use("/api/v1/games", gameRoutes);

    // Nested Routes (Units/Stations linked to Games)
    // Note: Express Router with mergeParams allows accessing :id from parent
    app.use("/api/v1/games/:id/units", unitRoutes);
    app.use("/api/v1/games/:id/stations", stationRoutes);
    app.use("/api/v1/games/:id/conversations", chatRoutes);
    app.use("/api/v1/players", playerRoutes);

    // Status route
    app.get("/status", (req, res) => {
      return res.status(200).json({ status: "Solaris: Command Server Online" });
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
