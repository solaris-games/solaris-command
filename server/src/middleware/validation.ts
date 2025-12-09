import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ERROR_CODES } from "./error-codes";

export const validate =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          errorCode: ERROR_CODES.REQUEST_VALIDATION_FAILED,
          details: error.issues.map((e) => ({
            // TODO: Is this `errors` or `issues`?
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }

      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.REQUEST_VALIDATION_FAILED });
    }
  };

// Common Schemas
export const HexSchema = z.object({
  q: z.number(),
  r: z.number(),
  s: z.number(),
});

export const DeployUnitSchema = z.object({
  catalogId: z.string(),
  hexId: z.string(),
});

export const MoveUnitSchema = z.object({
  path: z.array(HexSchema).min(1), // TODO: This should be an array of hex IDs?
});

export const AttackUnitSchema = z.object({
  hexId: z.string(),
  combatType: z.enum(["STANDARD", "FEINT", "SUPPRESSIVE"]), // Match core types
});

export const BuildStationSchema = z.object({
  hexId: z.string(),
});

export const UpgradeUnitSchema = z.object({
  type: z.enum(["STEP", "SPECIALIST"]),
  specialistId: z.string().nullable(), // ID from Spec Catalog
});

export const JoinGameSchema = z.object({
  alias: z.string().min(3),
  color: z.string().length(7),
});
