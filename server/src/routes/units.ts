import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { getDb } from "../db/instance";
import { Game, GameStates, Unit, Player, Station, Hex, HexUtils } from "@solaris-command/core";
import { validate, DeployUnitSchema, MoveUnitSchema, AttackUnitSchema } from "../middleware/validation";

const router = express.Router({ mergeParams: true });

// Helper to get game and verify player
async function getGameAndPlayer(gameId: string, userId: string) {
    const db = getDb();
    const game = await db.collection<Game>("games").findOne({ _id: new ObjectId(gameId) });
    if (!game) throw new Error("Game not found");

    const player = await db.collection<Player>("players").findOne({ gameId: new ObjectId(gameId), userId: userId });
    if (!player) throw new Error("Player not found in this game");

    return { game, player, db };
}

// POST /api/v1/games/:id/units/deploy
router.post("/deploy", authenticateToken, validate(DeployUnitSchema), async (req, res) => {
    const userId = req.user?.id;
    const { id: gameId } = req.params;
    const { unitClass } = req.body; // e.g., "Frigate", "Destroyer"

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { game, player, db } = await getGameAndPlayer(gameId, userId);

        if (game.state.status !== GameStates.ACTIVE) {
             return res.status(400).json({ error: "Game is not active" });
        }

        // Logic to spawn unit
        // 1. Check resources (Prestige)
        // 2. Determine spawn location (near Capital)
        // 3. Create Unit

        // Simplified: Just create a unit at 0,0,0 (assume capital)
        const spawnLocation = { q: 0, r: 0, s: 0 };
        // TODO: fetch actual capital location

        const newUnit: any = {
            gameId: new ObjectId(gameId),
            playerId: player._id,
            class: unitClass || "Frigate",
            location: spawnLocation,
            stats: { steps: 2, maxSteps: 4 }, // Placeholder
            status: "IDLE"
        };

        const result = await db.collection("units").insertOne(newUnit);
        res.json({ message: "Unit deployed", unit: { ...newUnit, _id: result.insertedId } });

    } catch (error: any) {
        res.status(400).json({ error: error.message || "Error deploying unit" });
    }
});

// POST /api/v1/games/:id/units/:unitId/move
router.post("/:unitId/move", authenticateToken, validate(MoveUnitSchema), async (req, res) => {
    const userId = req.user?.id;
    const { id: gameId, unitId } = req.params;
    const { targetHex } = req.body; // { q, r, s }

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { game, player, db } = await getGameAndPlayer(gameId, userId);

        if (game.state.status !== GameStates.ACTIVE) return res.status(400).json({ error: "Game not active" });

        const unit = await db.collection<Unit>("units").findOne({ _id: new ObjectId(unitId), playerId: player._id });
        if (!unit) return res.status(404).json({ error: "Unit not found" });

        // Logic: Set path
        // For now, simply update the 'target' or 'path' field on the unit?
        // The game loop handles actual movement.
        // We might need a 'path' field in the Unit model or a separate 'MoveOrder'.
        // The TickProcessor likely looks for units with a path.

        // Let's assume we update `status` to `MOVING` and set a `target`.
        // The schema in setup.ts showed `status`. We might need to add `path` to the schema or model.

        await db.collection("units").updateOne({ _id: unit._id }, {
            $set: {
                status: "MOVING",
                target: targetHex // Need to ensure this exists in Unit model
            }
        });

        res.json({ message: "Move order issued" });

    } catch (error: any) {
        res.status(400).json({ error: error.message || "Error moving unit" });
    }
});

// POST /api/v1/games/:id/units/:unitId/attack
router.post("/:unitId/attack", authenticateToken, validate(AttackUnitSchema), async (req, res) => {
     const userId = req.user?.id;
    const { id: gameId, unitId } = req.params;
    const { targetUnitId } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { game, player, db } = await getGameAndPlayer(gameId, userId);
        if (game.state.status !== GameStates.ACTIVE) return res.status(400).json({ error: "Game not active" });

        const unit = await db.collection<Unit>("units").findOne({ _id: new ObjectId(unitId), playerId: player._id });
        if (!unit) return res.status(404).json({ error: "Unit not found" });

        // Logic: Set attack order
        // Combat engine requires `PREPARING` state?
        // "Declaration: Attacker targets an adjacent enemy and spends 1 AP."

        // 1. Check AP
        // if (player.resources.actionPoints < 1) ...

        await db.collection("units").updateOne({ _id: unit._id }, {
            $set: {
                status: "PREPARING",
                targetUnitId: new ObjectId(targetUnitId)
            }
        });

         res.json({ message: "Attack declared" });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/v1/games/:id/units/:unitId/upgrade
router.post("/:unitId/upgrade", authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const { id: gameId, unitId } = req.params;
    const { type, specialistType } = req.body; // type: "STEP" | "SPECIALIST"

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { player, db } = await getGameAndPlayer(gameId, userId);

        const unit = await db.collection<Unit>("units").findOne({ _id: new ObjectId(unitId), playerId: player._id });
        if (!unit) return res.status(404).json({ error: "Unit not found" });

        // Logic: Upgrade
        // 1. Cost calculation
        // 2. Check limits (max steps)
        // 3. Apply upgrade

        let cost = 0;
        const update: any = {};

        if (type === "STEP") {
            if (unit.stats.steps >= unit.stats.maxSteps) {
                 return res.status(400).json({ error: "Unit already at max steps" });
            }
            cost = 10; // Placeholder cost
            // TODO: check player prestige

            update.$inc = { "stats.steps": 1 };
        } else if (type === "SPECIALIST") {
             if (!specialistType) return res.status(400).json({ error: "Specialist type required" });
             cost = 50;
             // TODO: check player prestige

             update.$push = { "stats.specialists": specialistType };
        } else {
            return res.status(400).json({ error: "Invalid upgrade type" });
        }

        // Apply
        await db.collection("units").updateOne({ _id: unit._id }, update);

        // Deduct cost (Placeholder)
        // await db.collection("players").updateOne({ _id: player._id }, { $inc: { "resources.prestige": -cost } });

        res.json({ message: "Unit upgraded", cost });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/v1/games/:id/units/:unitId/scrap
router.post("/:unitId/scrap", authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    const { id: gameId, unitId } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { player, db } = await getGameAndPlayer(gameId, userId);
        const result = await db.collection("units").deleteOne({ _id: new ObjectId(unitId), playerId: player._id });

        if (result.deletedCount === 0) return res.status(404).json({ error: "Unit not found" });

        // Refund?
        res.json({ message: "Unit scrapped" });
    } catch (error: any) {
         res.status(400).json({ error: error.message });
    }
});


export default router;
