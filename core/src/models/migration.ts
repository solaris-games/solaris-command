import { ObjectId } from "mongodb";

export interface MigrationLog {
  _id: ObjectId;
  filename: string;
  executedAt: Date;
}
