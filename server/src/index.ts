import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { GameLoop } from "./cron/game-loop";
import { connectToDb } from "./db";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import gameRoutes from "./routes/games";
import unitRoutes from "./routes/units";
import stationRoutes from "./routes/stations";
import { CreateGameJob } from "./cron/create-game";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

async function startServer() {
  try {
    // 1. Connect to MongoDB
    const { client } = await connectToDb();

    // 2. Start cron jobs
    GameLoop.start(client);
    CreateGameJob.start(client);

    // 3. Start Express
    app.listen(port, () => {
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

    // Status route
    app.get("/status", (req, res) => {
      res.json({ status: "Solaris: Command Server Online" });
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
