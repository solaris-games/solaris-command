import { UnifiedId } from ".";

// TODO: Need to implement a migration utility for this that uses Mongoose or raw MongoDB?

export interface MigrationLog {
  _id: UnifiedId;
  filename: string;
  executedAt: Date;
}
