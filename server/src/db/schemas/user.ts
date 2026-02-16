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
    unique: true,
    sparse: true, // Allows multiple documents to have 'null'
    default: null, // Ensures it is explicitly null if not provided
  },
  discordId: {
    type: String,
    unique: true,
    sparse: true,
    default: null,
  },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  lastSeenDate: { type: Date, required: true, default: Date.now },
  achievements: { type: UserAchievementsSchema, required: true },
});

export const UserModel = model<User>("User", UserSchema);
