import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { getDb } from "../db/instance";
import { Game, GameStates, Unit, Player, Station, Hex, HexUtils, UNITS, SPECIALISTS, UnitManager, UnitManagerHelper } from "@solaris-command/core";
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

        // Generate initial steps using helper
        // "New units spawn ... They spawn with All Steps Suppressed." - GDD
        const initialSteps = UnitManagerHelper.addSteps([], unitTemplate.steps);

        const newUnit: any = {
            gameId: new ObjectId(gameId),
            playerId: player._id,
            catalogId: unitId,
            location: spawnLocation,
            steps: initialSteps,
            state: {
                status: "IDLE",
                ap: 0,
                mp: 0,
                activeSteps: 0,
                suppressedSteps: initialSteps.length
            },
            movement: null,
            combat: null,
            supply: {
                isInSupply: true,
                ticksOutOfSupply: 0
            }
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
        let newSteps = [...unit.steps];

        // Fetch Catalog for Max Steps
        const unitTemplate = UNITS[unit.catalogId]; // Assuming catalogId exists
        if (!unitTemplate) return res.status(500).json({ error: "Unit template not found" });

        if (type === "STEP") {
            if (unit.state.activeSteps + unit.state.suppressedSteps >= unitTemplate.maxSteps) {
                 return res.status(400).json({ error: "Unit already at max steps" });
            }
            cost = 10; // Placeholder cost
            // TODO: check player prestige

            newSteps = UnitManagerHelper.addSteps(newSteps, 1);

        } else if (type === "SPECIALIST") {
             if (!specialistType) return res.status(400).json({ error: "Specialist type required" });

             const spec = SPECIALISTS[specialistType];
             if (!spec) return res.status(400).json({ error: "Invalid specialist type" });

             // Check Max Steps
             if (unit.state.activeSteps + unit.state.suppressedSteps >= unitTemplate.maxSteps) {
                return res.status(400).json({ error: "Unit already at max steps" });
             }

             cost = spec.cost;
             // TODO: check player prestige

             // Add specialist step (suppressed by default)
             newSteps = UnitManagerHelper.addSteps(newSteps, 1, spec);

        } else {
            return res.status(400).json({ error: "Invalid upgrade type" });
        }

        // Recalculate State counts
        const activeSteps = newSteps.filter(s => !s.isSuppressed).length;
        const suppressedSteps = newSteps.length - activeSteps;

        // Apply
        await db.collection("units").updateOne({ _id: unit._id }, {
            $set: {
                steps: newSteps,
                "state.activeSteps": activeSteps,
                "state.suppressedSteps": suppressedSteps
            }
        });

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
