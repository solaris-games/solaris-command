import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import {
  Unit,
  UnitManagerHelper,
  UnitStatuses,
  SPECIALIST_STEP_ID_MAP,
  UNIT_CATALOG_ID_MAP,
  CONSTANTS,
} from "@solaris-command/core";
import {
  validate,
  DeployUnitSchema,
  MoveUnitSchema,
  AttackUnitSchema,
  UpgradeUnitSchema,
} from "../middleware/validation";
import { loadGame, loadPlayer, requireActiveGame } from "../middleware";
import { UnitService } from "../services/UnitService";

const router = express.Router({ mergeParams: true });

// POST /api/v1/games/:id/units/deploy
router.post(
  "/deploy",
  authenticateToken,
  loadGame,
  requireActiveGame,
  loadPlayer,
  validate(DeployUnitSchema),
  async (req, res) => {
    const { unitId, location } = req.body;

    try {
      const unitTemplate = UNIT_CATALOG_ID_MAP.get(unitId);

      if (!unitTemplate)
        return res.status(400).json({ error: "Invalid Unit ID" });

      // TODO: Validate that the spawn location doesn't already contain a unit.

      // Logic to spawn unit
      // 1. Check resources (Prestige) -> unitTemplate.cost
      // 2. Determine spawn location (near Capital)
      // 3. Create Unit

      // Generate initial steps using helper
      // "New units spawn ... They spawn with All Steps Suppressed." - GDD
      const initialSteps = UnitManagerHelper.addSteps(
        [],
        unitTemplate.stats.defaultSteps
      );

      const newUnit: Unit = {
        _id: new ObjectId(),
        gameId: req.game._id,
        playerId: req.player._id,
        catalogId: unitId,
        location: location,
        steps: initialSteps,
        state: {
          status: UnitStatuses.IDLE,
          ap: 0,
          mp: Math.floor(unitTemplate.stats.maxMP / 2), // Units start with half MP
          activeSteps: 0,
          suppressedSteps: initialSteps.length,
        },
        movement: {
          path: [],
        },
        combat: {
          targetHex: null,
          cooldownEndTick: null,
          operation: null,
        },
        supply: {
          isInSupply: true,
          ticksLastSupply: 0,
          ticksOutOfSupply: 0,
        },
      };

      const createdUnit = await UnitService.createUnit(newUnit);

      res.json({
        message: "Unit deployed",
        unit: createdUnit,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Error deploying unit" });
    }
  }
);

// POST /api/v1/games/:id/units/:unitId/move
router.post(
  "/:unitId/move",
  authenticateToken,
  loadGame,
  requireActiveGame,
  loadPlayer,
  validate(MoveUnitSchema),
  async (req, res) => {
    const { unitId } = req.params;
    const { path } = req.body; // Hex[]

    try {
      const unit = await UnitService.getUnitById(new ObjectId(unitId));

      if (!unit || unit.playerId.toString() !== req.player._id.toString())
          return res.status(404).json({ error: "Unit not found" });

      // TODO: Validate path (Pathfinding check logic in core)

      await UnitService.updateUnitState(unit._id, "MOVING", { path });

      res.json({ message: "Move order issued" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Error moving unit" });
    }
  }
);

// POST /api/v1/games/:id/units/:unitId/cancel-move
router.post(
  "/:unitId/cancel-move",
  authenticateToken,
  loadGame,
  requireActiveGame,
  loadPlayer,
  async (req, res) => {
    const { unitId } = req.params;

    try {
      const unit = await UnitService.getUnitById(new ObjectId(unitId));

      if (!unit || unit.playerId.toString() !== req.player._id.toString())
          return res.status(404).json({ error: "Unit not found" });

      await UnitService.updateUnitState(unit._id, "IDLE", { path: [] });

      res.json({ message: "Move order cancelled" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// POST /api/v1/games/:id/units/:unitId/attack
router.post(
  "/:unitId/attack",
  authenticateToken,
  loadGame,
  requireActiveGame,
  loadPlayer,
  validate(AttackUnitSchema),
  async (req, res) => {
    const { unitId } = req.params;
    const { targetHex, combatType } = req.body;

    try {
      const unit = await UnitService.getUnitById(new ObjectId(unitId));

      if (!unit || unit.playerId.toString() !== req.player._id.toString())
          return res.status(404).json({ error: "Unit not found" });

      if (unit.state.ap === 0)
        return res.status(400).json({ error: "Unit does not have enough AP." });

      await UnitService.updateUnitState(unit._id, "PREPARING", undefined, {
          targetHex,
          type: combatType,
          cooldownEndTick: null
      });

      res.json({ message: "Attack declared" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// POST /api/v1/games/:id/units/:unitId/cancel-attack
router.post(
  "/:unitId/cancel-attack",
  authenticateToken,
  loadGame,
  requireActiveGame,
  loadPlayer,
  async (req, res) => {
    const { unitId } = req.params;

    try {
      const unit = await UnitService.getUnitById(new ObjectId(unitId));

      if (!unit || unit.playerId.toString() !== req.player._id.toString())
          return res.status(404).json({ error: "Unit not found" });

      if (unit.combat.targetHex == null)
        return res
          .status(400)
          .json({ error: "Unit has not declared an attack." });

      await UnitService.updateUnitState(unit._id, "IDLE", undefined, {
          targetHex: null,
          type: null,
          cooldownEndTick: null
      });

      res.json({ message: "Attack cancelled" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// POST /api/v1/games/:id/units/:unitId/upgrade
router.post(
  "/:unitId/upgrade",
  authenticateToken,
  loadGame,
  requireActiveGame,
  loadPlayer,
  validate(UpgradeUnitSchema),
  async (req, res) => {
    const { unitId } = req.params;
    const { type, specialistId } = req.body;

    try {
      const unit = await UnitService.getUnitById(new ObjectId(unitId));

      if (!unit || unit.playerId.toString() !== req.player._id.toString())
          return res.status(404).json({ error: "Unit not found" });

      // Logic: Upgrade
      // 1. Cost calculation
      // 2. Check limits (max steps)
      // 3. Apply upgrade

      let cost = 0;
      let newSteps = [...unit.steps];

      // Fetch Catalog for Max Steps
      const unitTemplate = UNIT_CATALOG_ID_MAP.get(unit.catalogId);

      if (!unitTemplate)
        return res.status(500).json({ error: "Unit template not found" });

      if (type === "STEP") {
        if (unit.steps.length >= unitTemplate.stats.maxSteps) {
          return res.status(400).json({ error: "Unit already at max steps" });
        }

        cost = CONSTANTS.GAME_UNIT_STANDARD_STEP_COST; // TODO: Should be a game setting?

        if (req.player.prestigePoints < cost) {
          return res
            .status(400)
            .json({ error: "You cannot afford to purchase this step" });
        }

        newSteps = UnitManagerHelper.addSteps(newSteps, 1);
      } else if (type === "SPECIALIST") {
        if (!specialistId)
          return res.status(400).json({ error: "Specialist ID required" });

        const spec = SPECIALIST_STEP_ID_MAP.get(specialistId);

        if (!spec)
          return res.status(400).json({ error: "Invalid specialist ID" });

        // Check Max Steps
        if (unit.steps.length >= unitTemplate.stats.maxSteps) {
          return res.status(400).json({ error: "Unit already at max steps" });
        }

        cost = spec.cost;

        if (req.player.prestigePoints < cost) {
          return res.status(400).json({
            error: "You cannot afford to purchase this specialist step",
          });
        }

        // Add specialist step (suppressed by default)
        newSteps = UnitManagerHelper.addSteps(newSteps, 1, spec);
      } else {
        return res.status(400).json({ error: "Invalid upgrade type" });
      }

      // Recalculate State counts
      const activeSteps = newSteps.filter((s) => !s.isSuppressed).length;
      const suppressedSteps = newSteps.length - activeSteps;

      // Apply Upgrade (Transactionally handled in Service)
      await UnitService.upgradeUnit(
          unit._id,
          newSteps,
          activeSteps,
          suppressedSteps,
          cost,
          req.player._id
      );

      res.json({ message: "Unit upgraded", cost });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// POST /api/v1/games/:id/units/:unitId/scrap
router.post(
  "/:unitId/scrap",
  authenticateToken,
  loadGame,
  requireActiveGame,
  loadPlayer,
  async (req, res) => {
    const { unitId } = req.params;

    try {
      const unit = await UnitService.getUnitById(new ObjectId(unitId));

      if (!unit || unit.playerId.toString() !== req.player._id.toString())
          return res.status(404).json({ error: "Unit not found" });

      // If there's more than 1 step then we scrap it, otherwise we delete the entire unit.
      if (unit.steps.length > 1) {
        // Reduce step
        const newSteps = UnitManagerHelper.scrapSteps(unit.steps, 1);

        // Recalculate State counts
        const activeSteps = newSteps.filter((s) => !s.isSuppressed).length;
        const suppressedSteps = newSteps.length - activeSteps;

        // Apply
        await UnitService.scrapUnitStep(
            unit._id,
            newSteps,
            activeSteps,
            suppressedSteps
        );

        res.json({ message: "Step scrapped" });
      } else {
        // Delete unit
        await UnitService.deleteUnit(unit._id);

        res.json({ message: "Unit scrapped" });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
