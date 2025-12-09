import { User, UserDetailsResponseSchema } from "@solaris-command/core";

export class UserMapper {
  static toUserDetailsResponse(user: User): UserDetailsResponseSchema {
    return {
      _id: String(user._id),
      username: user.username,
      lastSeenDate: user.lastSeenDate.toISOString(),
      achievements: {
        victories: user.achievements.victories,
        rank: user.achievements.rank,
        renown: user.achievements.renown,
      },
    };
  }
}
