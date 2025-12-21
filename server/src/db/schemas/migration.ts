import { Schema, model } from "mongoose";
import { MigrationLog } from "@solaris-command/core";

const MigrationLogSchema = new Schema<MigrationLog>({
  filename: { type: String, required: true },
  executedAt: { type: Date, required: true, default: Date.now },
});

export const MigrationLogModel = model<MigrationLog>("MigrationLog", MigrationLogSchema);
