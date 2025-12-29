import { UnifiedId, User } from "../types";

export const UserFactory = {
  create(
    googleId: string,
    email: string,
    username: string,
    idGenerator: () => UnifiedId
  ): User {
    return {
      _id: idGenerator(),
      googleId,
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
