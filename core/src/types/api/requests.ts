import { z } from "zod";

// Common Schemas
export const HexRequestSchema = z.object({
  q: z.number(),
  r: z.number(),
  s: z.number(),
});

export const DeployUnitRequestSchema = z.object({
  catalogId: z.string(),
  hexId: z.string(),
});

export const MoveUnitRequestSchema = z.object({
  path: z.array(HexRequestSchema).min(1), // TODO: This should be an array of hex IDs?
});

export const AttackUnitRequestSchema = z.object({
  hexId: z.string(),
  operation: z.enum(["STANDARD", "FEINT", "SUPPRESSIVE"]), // Match core types
  advanceOnVictory: z.boolean()
});

export const BuildStationRequestSchema = z.object({
  hexId: z.string(),
});

export const UpgradeUnitRequestSchema = z.object({
  type: z.enum(["STEP", "SPECIALIST"]),
  specialistId: z.string().nullable(), // ID from Spec Catalog
});

export const JoinGameRequestSchema = z.object({
  alias: z.string().min(3),
  color: z.string().length(7),
});
