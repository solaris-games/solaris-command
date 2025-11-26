import express from "express";
import { MongoClient } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";

import { Game } from "@solaris-command/core";
import { GameLoop } from "./cron/game-loop";
import { connectToDb } from "./db";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let db;

async function startServer() {
  try {
    // 1. Connect to MongoDB
    const { client } = await connectToDb();

    // 2. Start cron jobs
    GameLoop.start(client);

    // 3. Start Express
    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });

    // Example Route using Shared Type
    app.get("/status", (req, res) => {
      res.json({ status: "Solaris: Command Server Online" });
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
