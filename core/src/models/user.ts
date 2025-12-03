import { ObjectId } from "mongodb";

export interface UserAchievements {
  victories: number;
  rank: number;
  renown: number;
}

export interface User {
  _id: ObjectId;
  googleId: string;

  username: string;
  email: string;
  lastSeenDate: Date;
  achievements: UserAchievements;
}
