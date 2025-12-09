import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import {
  Unit,
  UnitManagerHelper,
  UnitStatus,
  SPECIALIST_STEP_ID_MAP,
  UNIT_CATALOG_ID_MAP,
  CONSTANTS,
  UnitManager,
  MapUtils,
} from "@solaris-command/core";
import {
  validate,
  DeployUnitSchema,
  MoveUnitSchema,
  AttackUnitSchema,
  UpgradeUnitSchema,
} from "../middleware/validation";
import {
  ERROR_CODES,
  loadGame,
  loadHexes,
  loadPlanets,
  loadPlayer,
  loadPlayerUnit,
  loadUnits,
  requireActiveGame,
  requireNonRegoupingUnit,
} from "../middleware";
import { UnitService } from "../services/UnitService";
import { PlayerService } from "../services/PlayerService";
import { executeInTransaction, getDb } from "../db";

const router = express.Router({ mergeParams: true });

// POST /api/v1/games/:id/units/deploy
router.post(
  "/deploy",
  authenticateToken,
  validate(DeployUnitSchema),
  loadGame,
  requireActiveGame,
  loadPlayer,
  loadHexes,
  loadPlanets,
  loadUnits,
  async (req, res) => {
    const { catalogId, hexId } = req.body;

    try {
      const unitCtlg = UNIT_CATALOG_ID_MAP.get(catalogId);

      if (!unitCtlg)
        return res.status(400).json({ errorCode: ERROR_CODES.UNIT_ID_INVALID });

      const hex = req.hexes.find((h) => String(h._id) === hexId);

      if (!hex) {
        return res.status(400).json({ errorCode: ERROR_CODES.HEX_ID_INVALID });
      }

      if (hex.unitId) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.HEX_OCCUPIED_BY_UNIT });
      }

      if (String(hex.playerId) !== String(req.player._id)) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.PLAYER_DOES_NOT_OWN_HEX });
      }

      const playerCapital = MapUtils.findPlayerCapital(
        req.planets,
        req.player._id
      );

      if (playerCapital == null) {
        return res.status(400).json({
          errorCode: ERROR_CODES.PLAYER_DOES_NOT_OWN_A_CAPITAL,
        });
      }

      const validSpawnLocations = UnitManager.getValidSpawnLocations(
        playerCapital!,
        req.hexes,
        req.units
      );

      if (validSpawnLocations.find((h) => String(h._id) === hexId) == null) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.HEX_INVALID_SPAWN_LOCATION });
      }

      if (req.player.prestigePoints < unitCtlg.cost) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.PLAYER_INSUFFICIENT_PRESTIGE });
      }

      // Generate initial steps using helper
      // "New units spawn ... They spawn with All Steps Suppressed." - GDD
      const initialSteps = UnitManagerHelper.addSteps(
        [],
        unitCtlg.stats.defaultSteps
      );

      const newUnit: Unit = {
        _id: new ObjectId(),
        gameId: req.game._id,
        playerId: req.player._id,
        catalogId: catalogId,
        location: hex.coords,
        steps: initialSteps,
        state: {
          status: UnitStatus.IDLE,
          ap: 0,
          mp: Math.floor(unitCtlg.stats.maxMP / 2), // Units start with half MP
          activeSteps: 0,
          suppressedSteps: initialSteps.length,
        },
        movement: {
          path: [],
        },
        combat: {
          hexId: null,
          operation: null,
        },
        supply: {
          isInSupply: true,
          ticksLastSupply: 0,
          ticksOutOfSupply: 0,
        },
      };

      const createdUnit = await executeInTransaction(async (db, session) => {
        const unit = await UnitService.createUnit(db, newUnit, session);

        await PlayerService.deductPrestigePoints(
          db,
          req.player._id,
          unitCtlg.cost,
          session
        );

        return unit;
      });

      res.json({
        unit: createdUnit,
      });
    } catch (error: any) {
      console.error("Error deploying unit:", error);
      res.status(500);
    }
  }
);

// POST /api/v1/games/:id/units/:unitId/move
router.post(
  "/:unitId/move",
  authenticateToken,
  validate(MoveUnitSchema),
  loadGame,
  requireActiveGame,
  loadPlayer,
  loadPlayerUnit,
  requireNonRegoupingUnit,
  async (req, res) => {
    const { path } = req.body; // Hex[]

    const db = getDb();

    try {
      // TODO: Validate path (Pathfinding check logic in core)
      await UnitService.updateUnitState(db, req.unit._id, "MOVING", { path });
    } catch (error: any) {
      console.error("Error moving unit:", error);
      res.status(500);
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
  loadPlayerUnit,
  requireNonRegoupingUnit,
  async (req, res) => {
    const db = getDb();

    try {
      await UnitService.updateUnitState(db, req.unit._id, "IDLE", { path: [] });
    } catch (error: any) {
      console.error("Error cancelling unit movement:", error);
      res.status(500);
    }
  }
);

// POST /api/v1/games/:id/units/:unitId/attack
router.post(
  "/:unitId/attack",
  authenticateToken,
  validate(AttackUnitSchema),
  loadGame,
  requireActiveGame,
  loadPlayer,
  loadPlayerUnit,
  requireNonRegoupingUnit,
  loadHexes,
  async (req, res) => {
    const { hexId, combatType } = req.body;

    const db = getDb();

    try {
      if (req.unit.state.ap === 0)
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.UNIT_INSUFFICIENT_AP });

      const hex = req.hexes.find((h) => String(h._id) === hexId);

      if (!hex) {
        return res.status(400).json({ errorCode: ERROR_CODES.HEX_ID_INVALID });
      }

      await UnitService.updateUnitState(
        db,
        req.unit._id,
        "PREPARING",
        undefined,
        {
          hexId,
          type: combatType,
        }
      );
    } catch (error: any) {
      console.error("Error declaring attack:", error);
      res.status(500);
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
  loadPlayerUnit,
  requireNonRegoupingUnit,
  async (req, res) => {
    const db = getDb();

    try {
      if (req.unit.combat.hexId == null)
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.UNIT_HAS_NOT_DECLARED_ATTACK });

      await UnitService.updateUnitState(db, req.unit._id, "IDLE", undefined, {
        hexId: null,
        type: null,
      });
    } catch (error: any) {
      console.error("Error cancelling attack:", error);
      res.status(500);
    }
  }
);

// POST /api/v1/games/:id/units/:unitId/upgrade
router.post(
  "/:unitId/upgrade",
  authenticateToken,
  validate(UpgradeUnitSchema),
  loadGame,
  requireActiveGame,
  loadPlayer,
  loadPlayerUnit,
  async (req, res) => {
    const { type, specialistId } = req.body;

    try {
      // Logic: Upgrade
      // 1. Cost calculation
      // 2. Check limits (max steps)
      // 3. Apply upgrade

      let cost = 0;
      let newSteps = [...req.unit.steps];

      // Fetch Catalog for Max Steps
      const unitTemplate = UNIT_CATALOG_ID_MAP.get(req.unit.catalogId);

      if (!unitTemplate)
        return res
          .status(500)
          .json({ errorCode: ERROR_CODES.UNIT_TEMPLATE_NOT_FOUND });

      if (type === "STEP") {
        if (req.unit.steps.length >= unitTemplate.stats.maxSteps) {
          return res
            .status(400)
            .json({ errorCode: ERROR_CODES.UNIT_IS_AT_MAX_STEPS });
        }

        cost = CONSTANTS.GAME_UNIT_STANDARD_STEP_COST; // TODO: Should be a game setting?

        if (req.player.prestigePoints < cost) {
          return res
            .status(400)
            .json({ errorCode: ERROR_CODES.PLAYER_INSUFFICIENT_PRESTIGE });
        }

        newSteps = UnitManagerHelper.addSteps(newSteps, 1);
      } else if (type === "SPECIALIST") {
        if (!specialistId)
          return res
            .status(400)
            .json({ errorCode: ERROR_CODES.UNIT_SPECIALIST_ID_REQUIRED });

        const spec = SPECIALIST_STEP_ID_MAP.get(specialistId);

        if (!spec)
          return res
            .status(400)
            .json({ errorCode: ERROR_CODES.UNIT_SPECIALIST_ID_INVALID });

        // Check Max Steps
        if (req.unit.steps.length >= unitTemplate.stats.maxSteps) {
          return res
            .status(400)
            .json({ errorCode: ERROR_CODES.UNIT_IS_AT_MAX_STEPS });
        }

        cost = spec.cost;

        if (req.player.prestigePoints < cost) {
          return res.status(400).json({
            errorCode: ERROR_CODES.PLAYER_INSUFFICIENT_PRESTIGE,
          });
        }

        // Add specialist step (suppressed by default)
        newSteps = UnitManagerHelper.addSteps(newSteps, 1, spec);
      } else {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.UNIT_INVALID_UPGRADE_TYPE });
      }

      // Recalculate State counts
      const activeSteps = newSteps.filter((s) => !s.isSuppressed).length;
      const suppressedSteps = newSteps.length - activeSteps;

      await executeInTransaction(async (db, session) => {
        // Apply Upgrade
        await UnitService.upgradeUnit(
          db,
          req.unit._id,
          newSteps,
          activeSteps,
          suppressedSteps,
          session
        );

        // Deduct Cost
        await PlayerService.deductPrestigePoints(
          db,
          req.player._id,
          cost,
          session
        );
      });
    } catch (error: any) {
      console.error("Error upgrading unit:", error);
      res.status(500);
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
  loadPlayerUnit,
  async (req, res) => {
    const db = getDb();

    try {
      // If there's more than 1 step then we scrap it, otherwise we delete the entire unit.
      if (req.unit.steps.length > 1) {
        // Reduce step
        const newSteps = UnitManagerHelper.scrapSteps(req.unit.steps, 1);

        // Recalculate State counts
        const activeSteps = newSteps.filter((s) => !s.isSuppressed).length;
        const suppressedSteps = newSteps.length - activeSteps;

        // Apply
        await UnitService.scrapUnitStep(
          db,
          req.unit._id,
          newSteps,
          activeSteps,
          suppressedSteps
        );
      } else {
        // Delete unit
        await UnitService.deleteUnit(db, req.unit._id);
      }
    } catch (error: any) {
      console.error("Error scrapping unit step:", error);
      res.status(500);
    }
  }
);

export default router;
