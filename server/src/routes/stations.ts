import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { getDb } from "../db/instance";
import { Game, GameStates, Player, Station } from "@solaris-command/core";
import { validate, BuildStationSchema } from "../middleware/validation";

const router = express.Router({ mergeParams: true });

async function getGameAndPlayer(gameId: string, userId: string) {
    const db = getDb();
    const game = await db.collection<Game>("games").findOne({ _id: new ObjectId(gameId) });
    if (!game) throw new Error("Game not found");

    const player = await db.collection<Player>("players").findOne({ gameId: new ObjectId(gameId), userId: userId });
    if (!player) throw new Error("Player not found in this game");

    return { game, player, db };
}

// POST /api/v1/games/:id/stations
router.post("/", authenticateToken, validate(BuildStationSchema), async (req, res) => {
    const userId = req.user?.id;
    const { id: gameId } = req.params;
    const { location } = req.body; // { q, r, s }

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { game, player, db } = await getGameAndPlayer(gameId, userId);

        if (game.state.status !== GameStates.ACTIVE) return res.status(400).json({ error: "Game not active" });

        // Logic: Build Station
        // 1. Check pool limit (capped by planets)
        // 2. Check resources
        // 3. Create Station in CONSTRUCTING state

        const newStation: any = {
            gameId: new ObjectId(gameId),
            playerId: player._id,
            location: location,
            state: "CONSTRUCTING",
            constructionStartCycle: game.state.cycle
        };

        const result = await db.collection("stations").insertOne(newStation);
        res.json({ message: "Station construction started", station: { ...newStation, _id: result.insertedId } });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/v1/games/:id/stations/:stationId
router.delete("/:stationId", authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const { id: gameId, stationId } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { player, db } = await getGameAndPlayer(gameId, userId);

        const station = await db.collection<Station>("stations").findOne({ _id: new ObjectId(stationId), playerId: player._id });
        if (!station) return res.status(404).json({ error: "Station not found" });

        // Logic: Decommission
        // Sets state to DECOMMISSIONING, doesn't delete immediately?
        // "When a player removes a station, it enters this state for 1 Cycle."

        await db.collection("stations").updateOne({ _id: station._id }, {
            $set: { state: "DECOMMISSIONING" }
        });

        res.json({ message: "Station decommissioning started" });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
