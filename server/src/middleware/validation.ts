import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validate = (schema: z.ZodSchema) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors.map((e) => ({
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
    s: z.number()
});

export const DeployUnitSchema = z.object({
    unitClass: z.enum(["Frigate", "Destroyer", "Battleships"]) // Match Core types if possible
});

export const MoveUnitSchema = z.object({
    targetHex: HexSchema
});

export const AttackUnitSchema = z.object({
    targetUnitId: z.string().length(24) // ObjectId string
});

export const BuildStationSchema = z.object({
    location: HexSchema
});
