import { ObjectId } from 'mongodb';

export interface UserAchievements {
  victories: number;
  rank: number;
  renown: number;
}

export interface User {
  _id: ObjectId;
  
  username: string;
  email: string;

  lastSeenDate: Date;
  lastSeenIP: string;

  achievements: UserAchievements;
}