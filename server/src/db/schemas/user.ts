import { Schema, model } from "mongoose";
import { User, UserAchievements } from "@solaris-command/core";

const UserAchievementsSchema = new Schema<UserAchievements>(
  {
    victories: { type: Number, required: true, default: 0 },
    rank: { type: Number, required: true, default: 0 },
    renown: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const UserSchema = new Schema<User>({
  googleId: {
    type: String,
    default: null,
  },
  discordId: {
    type: String,
    default: null,
  },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  lastSeenDate: { type: Date, required: true, default: Date.now },
  achievements: { type: UserAchievementsSchema, required: true },
});

// Partial unique indexes to allow multiple nulls for googleId and discordId
UserSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $ne: null } } },
);

UserSchema.index(
  { discordId: 1 },
  { unique: true, partialFilterExpression: { discordId: { $ne: null } } },
);

export const UserModel = model<User>("User", UserSchema);
