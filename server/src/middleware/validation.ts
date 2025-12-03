import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validate =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((e) => ({ // TODO: Is this `errors` or `issues`?
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({ error: "Invalid request" });
    }
  };

// Common Schemas
export const HexSchema = z.object({
  q: z.number(),
  r: z.number(),
  s: z.number(),
});

export const DeployUnitSchema = z.object({
  unitId: z.string(), // ID from the Unit Catalog
  location: HexSchema,
});

export const MoveUnitSchema = z.object({
  path: z.array(HexSchema).min(1),
});

export const AttackUnitSchema = z.object({
  targetHex: HexSchema,
  combatType: z.enum(["STANDARD", "FEINT", "SUPPRESSIVE"]), // Match core types
});

export const BuildStationSchema = z.object({
  location: HexSchema,
});

export const UpgradeUnitSchema = z.object({
  type: z.enum(["STEP", "SPECIALIST"]),
  specialistId: z.string().nullable(), // ID from Spec Catalog
});
