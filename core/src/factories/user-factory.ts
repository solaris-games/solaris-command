import { UnifiedId, User } from "../types";

export const UserFactory = {
  create(
    googleId: string,
    discordId: string,
    email: string,
    username: string,
    idGenerator: () => UnifiedId
  ): User {
    return {
      _id: idGenerator(),
      googleId,
      discordId,
      email,
      username,
      lastSeenDate: new Date(),
      achievements: {
        victories: 0,
        rank: 0,
        renown: 0,
      },
    };
  },
};
