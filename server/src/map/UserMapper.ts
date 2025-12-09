import { User, UserDetailsResponse } from "@solaris-command/core";

export class UserMapper {
  static toUserDetailsResponse(user: User): UserDetailsResponse {
    // We might want to strip internal fields here if User has sensitive data
    // For now, it seems to match the interface
    return user;
  }
}
