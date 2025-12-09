import { User, LoginResponseSchema } from "@solaris-command/core";
import { UserMapper } from "./UserMapper";

export class AuthMapper {
  static toLoginResponse(token: string, user: User): LoginResponseSchema {
    return {
      token,
      user: UserMapper.toUserDetailsResponse(user),
    };
  }
}
