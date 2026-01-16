import express from "express";
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
  ERROR_CODES,
  UnitFactory,
  GameEventFactory,
  GameEventTypes,
  SpecialistStepTypes,
} from "@solaris-command/core";
import {
  loadGame,
  loadPlanets,
  loadPlayer,
  loadPlayerHexes,
  loadPlayerUnit,
  loadUnits,
  requireNonRegoupingUnit,
  requireInPlayGame,
  validateRequest,
} from "../middleware";
import {
  UnitService,
  PlayerService,
  HexService,
  GameService,
} from "../services";
import { executeInTransaction } from "../db";
import { UnitMapper } from "../map";
import { Types } from "mongoose";

const router = express.Router({ mergeParams: true });

// POST /api/v1/games/:id/units/deploy
router.post(
  "/deploy",
  authenticateToken,
  validateRequest(DeployUnitRequestSchema),
  loadGame,
  requireInPlayGame,
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
        req.units,
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

      // Generate initial steps. All but one should be suppressed.
      const initialSteps = UnitManager.addSteps(
        [],
        unitCtlg.stats.defaultSteps,
      );

      initialSteps[0].isSuppressed = false; // The first step should not be suppressed.

      const newUnit = UnitFactory.create(
        catalogId,
        req.player._id,
        req.game._id,
        hex._id,
        hex.location,
        () => new Types.ObjectId(),
      );

      // Manual override for deploy stats
      // Units start with half MP
      newUnit.state.mp = Math.floor(unitCtlg.stats.maxMP / 2);
      newUnit.state.ap = 0;
      newUnit.steps = initialSteps;

      const createdUnit = await executeInTransaction(async (session) => {
        const unit = await UnitService.createUnit(newUnit, session);

        await HexService.updateHexUnit(
          req.game._id,
          hex._id,
          unit._id,
          session,
        );

        // Note: All units spawn with all steps suppressed, therefore this unit will not exert a ZOC

        await PlayerService.deductPrestigePoints(
          req.game._id,
          req.player._id,
          unitCtlg.cost,
          session,
        );

        await GameService.createGameEvent(
          GameEventFactory.create(
            req.game._id,
            unit.playerId,
            req.game.state.tick,
            GameEventTypes.UNIT_DEPLOYED,
            {
              unit,
            },
            () => new Types.ObjectId(),
          ),
          session,
        );

        // TODO: Unit deployed websocket is tricky since we need to send only
        // to players who have vision on the hex.

        return unit;
      });

      res.status(201).json(UnitMapper.toDeployUnitResponse(createdUnit));
    } catch (error: any) {
      console.error("Error deploying unit:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }
  },
);

// POST /api/v1/games/:id/units/:unitId/move
router.post(
  "/:unitId/move",
  authenticateToken,
  validateRequest(MoveUnitRequestSchema),
  loadGame,
  requireInPlayGame,
  loadPlayer,
  loadPlayerUnit,
  requireNonRegoupingUnit,
  async (req, res) => {
    const { hexIdPath }: { hexIdPath: string[] } = req.body; // (Hex IDs)

    // Validate that the movement path isn't longer than an entire cycle.
    if (hexIdPath.length > CONSTANTS.GAME_DEFAULT_TICKS_PER_CYCLE) {
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.UNIT_MOVEMENT_PATH_TOO_LONG });
    }

    // Unit must be idle to declare movement
    if (req.unit.state.status !== UnitStatus.IDLE) {
      return res.status(400).json({ errorCode: ERROR_CODES.UNIT_IS_NOT_IDLE });
    }

    // Load only the hexes that the request body contains, this is better than loading ALL hexes in the game.
    const hexIds = hexIdPath.map((id) => new Types.ObjectId(id));
    req.hexes = await HexService.getByGameAndIds(req.game._id, hexIds);

    // Convert hex list to map for easier lookup in pathfinding
    const hexMap = new Map<HexCoordsId, any>();
    req.hexes.forEach((hex) => {
      hexMap.set(HexUtils.getCoordsID(hex.location), hex);
    });

    const hexPath = hexIdPath
      .map((id) => req.hexes.find((h) => String(h._id) === String(id)))
      .map((h) => h.location);

    try {
      const validationResult = Pathfinding.validatePath(
        req.unit.location,
        hexPath,
        req.unit.state.mp,
        hexMap,
        req.player._id,
      );

      if (!validationResult.valid) {
        return res.status(400).json({
          errorCode:
            validationResult.error || ERROR_CODES.REQUEST_VALIDATION_FAILED,
        });
      }

      await UnitService.declareUnitMovement(req.game._id, req.unit._id, {
        path: hexPath,
      });
    } catch (error: any) {
      console.error("Error moving unit:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }

    res.json({});
  },
);

// POST /api/v1/games/:id/units/:unitId/cancel-move
router.post(
  "/:unitId/cancel-move",
  authenticateToken,
  loadGame,
  requireInPlayGame,
  loadPlayer,
  loadPlayerUnit,
  requireNonRegoupingUnit,
  async (req, res) => {
    // Unit must be moving to cancel movement
    if (req.unit.state.status !== UnitStatus.MOVING) {
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.UNIT_IS_NOT_MOVING });
    }

    try {
      await UnitService.cancelUnitMovement(req.game._id, req.unit._id);
    } catch (error: any) {
      console.error("Error cancelling unit movement:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }

    res.json({});
  },
);

// POST /api/v1/games/:id/units/:unitId/attack
router.post(
  "/:unitId/attack",
  authenticateToken,
  validateRequest(AttackUnitRequestSchema),
  loadGame,
  requireInPlayGame,
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
    const hex = await HexService.getByGameAndLocation(req.game._id, location);

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

    const targetUnit = await UnitService.getUnitById(req.game._id, hex.unitId);

    if (!targetUnit) {
      return res.status(400).json({ errorCode: ERROR_CODES.UNIT_NOT_FOUND });
    }

    if (String(targetUnit.playerId) === String(req.player._id)) {
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.UNIT_CANNOT_ATTACK_OWN_UNIT });
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

    // Units must not be attacking eachother.
    if (
      targetUnit.state.status === UnitStatus.PREPARING &&
      String(targetUnit.combat.hexId) === String(req.unit.hexId)
    ) {
      throw new Error(ERROR_CODES.UNIT_CANNOT_COUNTER_ATTACK);
    }

    try {
      await UnitService.declareUnitAttack(req.game._id, req.unit._id, {
        hexId: hex._id,
        location,
        operation,
        advanceOnVictory,
      });
    } catch (error: any) {
      console.error("Error declaring attack:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }

    res.json({});
  },
);

// POST /api/v1/games/:id/units/:unitId/cancel-attack
router.post(
  "/:unitId/cancel-attack",
  authenticateToken,
  loadGame,
  requireInPlayGame,
  loadPlayer,
  loadPlayerUnit,
  requireNonRegoupingUnit,
  async (req, res) => {
    // Unit must be preparing an attack to cancel
    if (req.unit.state.status !== UnitStatus.PREPARING) {
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.UNIT_IS_NOT_PREPARING });
    }

    if (req.unit.combat.hexId == null && req.unit.combat.location == null)
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.UNIT_HAS_NOT_DECLARED_ATTACK });

    try {
      await UnitService.cancelUnitAttack(req.game._id, req.unit._id);
    } catch (error: any) {
      console.error("Error cancelling attack:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }

    res.json({});
  },
);

// POST /api/v1/games/:id/units/:unitId/upgrade
router.post(
  "/:unitId/upgrade",
  authenticateToken,
  validateRequest(UpgradeUnitRequestSchema),
  loadGame,
  requireInPlayGame,
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

        cost = CONSTANTS.UNIT_STEP_BASE_COST; // TODO: Should be a game setting?

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

        // If the user is trying to purchase a scout specialist then we need to check that
        // the unit can project a ZOC.
        if (
          spec.type === SpecialistStepTypes.SCOUTS &&
          !unitTemplate.stats.zoc
        ) {
          return res
            .status(400)
            .json({ errorCode: ERROR_CODES.UNIT_DOES_NOT_PROJECT_ZOC });
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

      await executeInTransaction(async (session) => {
        // Apply Upgrade
        await UnitService.upgradeUnit(
          req.game._id,
          req.unit._id,
          newSteps,
          session,
        );

        // Deduct Cost
        await PlayerService.deductPrestigePoints(
          req.game._id,
          req.player._id,
          cost,
          session,
        );
      });
    } catch (error: any) {
      console.error("Error upgrading unit:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }

    res.json({});
  },
);

// POST /api/v1/games/:id/units/:unitId/scrap
router.post(
  "/:unitId/scrap",
  authenticateToken,
  loadGame,
  requireInPlayGame,
  loadPlayer,
  loadPlayerUnit,
  async (req, res) => {
    // Unit must be in supply to scrap
    if (!req.unit.supply.isInSupply) {
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.UNIT_IS_NOT_IN_SUPPLY });
    }

    try {
      await executeInTransaction(async (session) => {
        // If there's more than 1 step then we scrap it, otherwise we delete the entire unit.
        if (req.unit.steps.length > 1) {
          // Reduce step
          const newSteps = UnitManager.scrapSteps(req.unit.steps, 1);

          // Apply
          await UnitService.scrapUnitStep(
            req.game._id,
            req.unit._id,
            newSteps,
            session,
          );

          // Give player back some prestige.
          await PlayerService.incrementPrestigePoints(
            req.game._id,
            req.unit.playerId,
            CONSTANTS.UNIT_STEP_SCRAP_PRESTIGE_REWARD,
            session,
          );
        } else {
          const hex = await HexService.getByGameAndId(
            req.game._id,
            req.unit.hexId,
          );

          // Delete unit
          await UnitService.deleteUnit(req.game._id, req.unit._id, session);
          await HexService.updateHexUnit(req.game._id, hex!._id, null);

          await HexService.removeUnitFromAdjacentHexZOC(
            req.game._id,
            hex!,
            req.unit,
            session,
          );

          // Any units that are attempting to attack this hex should be cancelled.
          await UnitService.cancelUnitAttackByHex(req.game._id, hex!._id);

          // TODO: If a unit is attempting to attack the hex and
          // it has `advanceOnVictory` enabled, we should convert that
          // order into a movement if the unit has enough MP?
        }
      });
    } catch (error: any) {
      console.error("Error scrapping unit step:", error);

      return res.status(500).json({
        errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
      });
    }

    res.json({});
  },
);

export default router;
