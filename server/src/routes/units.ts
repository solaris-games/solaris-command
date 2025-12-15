import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import {
  Unit,
  UnitManager,
  UnitStatus,
  SPECIALIST_STEP_ID_MAP,
  UNIT_CATALOG_ID_MAP,
  CONSTANTS,
  CombatOperation,
  HexUtils,
  Pathfinding,
  DeployUnitRequestSchema,
  MoveUnitRequestSchema,
  AttackUnitRequestSchema,
  UpgradeUnitRequestSchema,
  HexCoords,
  HexCoordsId,
} from "@solaris-command/core";
import {
  ERROR_CODES,
  loadGame,
  loadPlanets,
  loadPlayer,
  loadPlayerHexes,
  loadPlayerUnit,
  loadUnits,
  requireActiveGame,
  requireNonRegoupingUnit,
  validateRequest,
} from "../middleware";
import { UnitService, PlayerService, HexService } from "../services";
import { executeInTransaction, getDb } from "../db";
import { UnitMapper } from "../map";

const router = express.Router({ mergeParams: true });

// POST /api/v1/games/:id/units/deploy
router.post(
  "/deploy",
  authenticateToken,
  validateRequest(DeployUnitRequestSchema),
  loadGame,
  requireActiveGame,
  loadPlayer,
  loadPlayerHexes,
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

      const validSpawnLocations = UnitManager.getValidSpawnLocations(
        req.player._id,
        req.planets,
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
      const initialSteps = UnitManager.addSteps(
        [],
        unitCtlg.stats.defaultSteps
      );

      const newUnit: Unit = {
        _id: new ObjectId(),
        gameId: req.game._id,
        playerId: req.player._id,
        catalogId: catalogId,
        location: hex.location,
        steps: initialSteps,
        state: {
          status: UnitStatus.IDLE,
          ap: 0,
          mp: Math.floor(unitCtlg.stats.maxMP / 2), // Units start with half MP
        },
        movement: {
          path: [],
        },
        combat: {
          location: null,
          operation: null,
          advanceOnVictory: null,
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

      res.json(UnitMapper.toDeployUnitResponse(createdUnit));
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
  validateRequest(MoveUnitRequestSchema),
  loadGame,
  requireActiveGame,
  loadPlayer,
  loadPlayerUnit,
  requireNonRegoupingUnit,
  async (req, res) => {
    const { hexIdPath }: { hexIdPath: string[] } = req.body; // (Hex IDs)

    // Validate that the movement path isn't longer than an entire cycle.
    if (req.path.length > CONSTANTS.GAME_DEFAULT_TICKS_PER_CYCLE) {
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.UNIT_MOVEMENT_PATH_TOO_LONG });
    }

    const db = getDb();

    // Unit must be idle to declare movement
    if (req.unit.state.status !== UnitStatus.IDLE) {
      return res.status(400).json({ errorCode: ERROR_CODES.UNIT_IS_NOT_IDLE });
    }

    // Load only the hexes that the request body contains, this is better than loading ALL hexes in the game.
    const hexIds = hexIdPath.map((id) => new ObjectId(id));
    req.hexes = await HexService.getByGameAndIds(db, req.game._id, hexIds);

    // Convert hex list to map for easier lookup in pathfinding
    const hexMap = new Map<HexCoordsId, any>();
    req.hexes.forEach((hex) => {
      hexMap.set(HexUtils.getCoordsID(hex.location), hex);
    });

    const hexPath = req.hexes.map((h) => h.location);

    try {
      const validationResult = Pathfinding.validatePath(
        req.unit.location,
        hexPath,
        req.unit.state.mp,
        hexMap
      );

      if (!validationResult.valid) {
        return res.status(400).json({
          errorCode:
            validationResult.error || ERROR_CODES.REQUEST_VALIDATION_FAILED,
        });
      }

      await UnitService.declareUnitMovement(db, req.unit._id, {
        path: hexPath,
      });
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

    // Unit must be moving to cancel movement
    if (req.unit.state.status !== UnitStatus.MOVING) {
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.UNIT_IS_NOT_MOVING });
    }

    try {
      await UnitService.cancelUnitMovement(db, req.unit._id);
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
  validateRequest(AttackUnitRequestSchema),
  loadGame,
  requireActiveGame,
  loadPlayer,
  loadPlayerUnit,
  requireNonRegoupingUnit,
  async (req, res) => {
    const {
      location,
      operation,
      advanceOnVictory,
    }: {
      location: HexCoords;
      operation: CombatOperation;
      advanceOnVictory: boolean;
    } = req.body;

    const db = getDb();

    // Unit must be idle to declare an attack
    if (req.unit.state.status !== UnitStatus.IDLE) {
      return res.status(400).json({ errorCode: ERROR_CODES.UNIT_IS_NOT_IDLE });
    }

    // Must have AP
    if (req.unit.state.ap === 0)
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.UNIT_INSUFFICIENT_AP });

    // Hex must be valid
    const hex = await HexService.getByGameAndLocation(
      db,
      req.game._id,
      location
    );

    if (!hex) {
      return res.status(400).json({ errorCode: ERROR_CODES.HEX_ID_INVALID });
    }

    // Hex must be adjacent
    if (!HexUtils.isNeighbor(req.unit.location, hex.location)) {
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.HEX_IS_NOT_ADJACENT });
    }

    // Hex must be occupied by a unit
    if (!hex.unitId) {
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.HEX_IS_NOT_OCCUPIED_BY_UNIT });
    }

    // If suppressive fire, then must have an artillery spec.
    if (operation === CombatOperation.SUPPRESSIVE_FIRE) {
      const hasArtillery = UnitManager.unitHasActiveSpecialistStep(req.unit);

      if (!hasArtillery) {
        return res.status(400).json({
          errorCode: ERROR_CODES.UNIT_MUST_HAVE_ACTIVE_ARTILLERY_SPECIALIST,
        });
      }
    }

    try {
      await UnitService.declareUnitAttack(db, req.unit._id, {
        location,
        operation,
        advanceOnVictory,
      });
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

    // Unit must be preparing an attack to cancel
    if (req.unit.state.status !== UnitStatus.PREPARING) {
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.UNIT_IS_NOT_PREPARING });
    }

    if (req.unit.combat.location == null)
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.UNIT_HAS_NOT_DECLARED_ATTACK });

    try {
      await UnitService.cancelUnitAttack(db, req.unit._id);
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
  validateRequest(UpgradeUnitRequestSchema),
  loadGame,
  requireActiveGame,
  loadPlayer,
  loadPlayerUnit,
  async (req, res) => {
    const { type, specialistId } = req.body;

    try {
      let cost = 0;
      let newSteps = [...req.unit.steps];

      // Fetch Catalog for Max Steps
      const unitTemplate = UNIT_CATALOG_ID_MAP.get(req.unit.catalogId);

      if (!unitTemplate)
        return res
          .status(500)
          .json({ errorCode: ERROR_CODES.UNIT_TEMPLATE_NOT_FOUND });

      // Unit must be in supply to upgrade
      if (!req.unit.supply.isInSupply) {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.UNIT_IS_NOT_IN_SUPPLY });
      }

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

        newSteps = UnitManager.addSteps(newSteps, 1);
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
        newSteps = UnitManager.addSteps(newSteps, 1, spec);
      } else {
        return res
          .status(400)
          .json({ errorCode: ERROR_CODES.UNIT_INVALID_UPGRADE_TYPE });
      }

      await executeInTransaction(async (db, session) => {
        // Apply Upgrade
        await UnitService.upgradeUnit(db, req.unit._id, newSteps, session);

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

    // Unit must be in supply to scrap
    if (!req.unit.supply.isInSupply) {
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.UNIT_IS_NOT_IN_SUPPLY });
    }

    try {
      // If there's more than 1 step then we scrap it, otherwise we delete the entire unit.
      if (req.unit.steps.length > 1) {
        // Reduce step
        const newSteps = UnitManager.scrapSteps(req.unit.steps, 1);

        // Apply
        await UnitService.scrapUnitStep(db, req.unit._id, newSteps);
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
