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
  hexIdPath: z.array(z.string()).min(1), // Array of Hex IDs.
});

export const AttackUnitRequestSchema = z.object({
  location: HexRequestSchema,
  operation: z.enum(["STANDARD", "FEINT", "SUPPRESSIVE_FIRE"]), // Match core types
  advanceOnVictory: z.boolean(),
});

export const BuildStationRequestSchema = z.object({
  hexId: z.string(),
});

export const UpgradeUnitRequestSchema = z.object({
  type: z.enum(["STEP", "SPECIALIST"]),
  specialistId: z.string().nullable(), // ID from Spec Catalog
});

export const JoinGameRequestSchema = z.object({
  alias: z
    .string()
    .trim()
    .min(3)
    .regex(/^[a-zA-Z0-9 _-]+$/, "Invalid characters in alias"),
  color: z.string(),
});

export const TradePrestigeRequestSchema = z.object({
  targetPlayerId: z.string().length(24),
  prestige: z.number().min(1),
});

export const SendRenownRequestSchema = z.object({
  targetPlayerId: z.string().length(24),
  renown: z.number().min(1),
});

export const CreateConversationRequestSchema = z.object({
  name: z.string().trim().optional(),
  participantPlayerIds: z.array(z.string().length(24)).min(1),
});

export const SendMessageRequestSchema = z.object({
  content: z.string().min(1).max(1000),
});
