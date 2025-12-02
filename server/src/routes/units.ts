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
router.post("/deploy", authenticateToken, requireActiveGame, validate(DeployUnitSchema), async (req, res) => {
    const userId = req.user?.id;
    const { id: gameId } = req.params;
    const { unitId } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { game, player, db } = await getGameAndPlayer(gameId, userId);

        const unitTemplate = UNITS[unitId];
        if (!unitTemplate) return res.status(400).json({ error: "Invalid Unit ID" });

        // Logic to spawn unit
        // 1. Check resources (Prestige) -> unitTemplate.cost
        // 2. Determine spawn location (near Capital)
        // 3. Create Unit

        // Simplified: Just create a unit at 0,0,0 (assume capital)
        const spawnLocation = { q: 0, r: 0, s: 0 };

        const newUnit: any = {
            gameId: new ObjectId(gameId),
            playerId: player._id,
            class: unitTemplate.class,
            unitId: unitId,
            location: spawnLocation,
            stats: {
                steps: unitTemplate.steps,
                maxSteps: unitTemplate.maxSteps,
                specialists: []
            },
            status: "IDLE"
        };

        const result = await db.collection("units").insertOne(newUnit);
        res.json({ message: "Unit deployed", unit: { ...newUnit, _id: result.insertedId } });

    } catch (error: any) {
        res.status(400).json({ error: error.message || "Error deploying unit" });
    }
});

// POST /api/v1/games/:id/units/:unitId/move
router.post("/:unitId/move", authenticateToken, requireActiveGame, validate(MoveUnitSchema), async (req, res) => {
    const userId = req.user?.id;
    const { id: gameId, unitId } = req.params;
    const { path } = req.body; // Hex[]

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { player, db } = await getGameAndPlayer(gameId, userId);

        const unit = await db.collection<Unit>("units").findOne({ _id: new ObjectId(unitId), playerId: player._id });
        if (!unit) return res.status(404).json({ error: "Unit not found" });

        // Validate path? (Pathfinding check logic usually happens here or in core)

        await db.collection("units").updateOne({ _id: unit._id }, {
            $set: {
                status: "MOVING",
                movement: {
                    path: path,
                    startTime: new Date()
                }
            }
        });

        res.json({ message: "Move order issued" });

    } catch (error: any) {
        res.status(400).json({ error: error.message || "Error moving unit" });
    }
});

// POST /api/v1/games/:id/units/:unitId/cancel-move
router.post("/:unitId/cancel-move", authenticateToken, requireActiveGame, async (req, res) => {
    const userId = req.user?.id;
    const { id: gameId, unitId } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { player, db } = await getGameAndPlayer(gameId, userId);

        const unit = await db.collection<Unit>("units").findOne({ _id: new ObjectId(unitId), playerId: player._id });
        if (!unit) return res.status(404).json({ error: "Unit not found" });

        await db.collection("units").updateOne({ _id: unit._id }, {
            $set: {
                status: "IDLE",
                movement: null
            }
        });

        res.json({ message: "Move order cancelled" });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/v1/games/:id/units/:unitId/attack
router.post("/:unitId/attack", authenticateToken, requireActiveGame, validate(AttackUnitSchema), async (req, res) => {
     const userId = req.user?.id;
    const { id: gameId, unitId } = req.params;
    const { targetHex, combatType } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { player, db } = await getGameAndPlayer(gameId, userId);

        const unit = await db.collection<Unit>("units").findOne({ _id: new ObjectId(unitId), playerId: player._id });
        if (!unit) return res.status(404).json({ error: "Unit not found" });

        // Logic: Set attack order
        // 1. Check AP

        await db.collection("units").updateOne({ _id: unit._id }, {
            $set: {
                status: "PREPARING",
                combat: {
                    targetHex: targetHex,
                    type: combatType,
                    round: 0
                }
            }
        });

         res.json({ message: "Attack declared" });

    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/v1/games/:id/units/:unitId/upgrade
router.post("/:unitId/upgrade", authenticateToken, requireActiveGame, async (req, res) => {
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
            // Using placeholder logic or UnitManager.addStep check would be ideal
            if (unit.stats.steps >= unit.stats.maxSteps) {
                 return res.status(400).json({ error: "Unit already at max steps" });
            }
            // Cost is generally 1/step but specialist steps differ.
            // Docs say: "Prestige can purchase Specialist Steps or replace lost standard steps."
            cost = 10; // Placeholder
            // TODO: check player prestige

            update.$inc = { "stats.steps": 1 };
        } else if (type === "SPECIALIST") {
             if (!specialistType) return res.status(400).json({ error: "Specialist type required" });

             const spec = SPECIALISTS[specialistType];
             if (!spec) return res.status(400).json({ error: "Invalid specialist type" });

             cost = spec.cost;
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
router.post("/:unitId/scrap", authenticateToken, requireActiveGame, async (req, res) => {
    const userId = req.user?.id;
    const { id: gameId, unitId } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { player, db } = await getGameAndPlayer(gameId, userId);

        const unit = await db.collection<Unit>("units").findOne({ _id: new ObjectId(unitId), playerId: player._id });
        if (!unit) return res.status(404).json({ error: "Unit not found" });

        // Logic: Scrap Step (not whole unit unless steps = 0)
        // Using core logic logic if available, or manual implementation

        if (unit.stats.steps > 0) {
            // Reduce step
             await db.collection("units").updateOne({ _id: unit._id }, { $inc: { "stats.steps": -1 } });
             res.json({ message: "Step scrapped" });
        } else {
             // Delete unit
            await db.collection("units").deleteOne({ _id: unit._id });
            res.json({ message: "Unit scrapped" });
        }

        // TODO: Refund prestige?

    } catch (error: any) {
         res.status(400).json({ error: error.message });
    }
});


export default router;
