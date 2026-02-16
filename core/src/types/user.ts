import { UnifiedId } from "./unified-id";

export interface UserAchievements {
  victories: number;
  rank: number;
  renown: number;
}

export interface User {
  _id: UnifiedId;
  googleId: string;
  discordId: string;

  username: string;
  email: string;
  lastSeenDate: Date;
  achievements: UserAchievements;
}
