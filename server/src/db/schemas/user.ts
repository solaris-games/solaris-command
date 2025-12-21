import { Schema, model } from "mongoose";
import { User, UserAchievements } from "@solaris-command/core";

const UserAchievementsSchema = new Schema<UserAchievements>(
  {
    victories: { type: Number, required: true, default: 0 },
    rank: { type: Number, required: true, default: 0 },
    renown: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const UserSchema = new Schema<User>({
  googleId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  lastSeenDate: { type: Date, required: true, default: Date.now },
  achievements: { type: UserAchievementsSchema, required: true },
});

export const UserModel = model<User>("User", UserSchema);
