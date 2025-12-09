import { User, LoginResponse } from "@solaris-command/core";

export class AuthMapper {
  static toLoginResponse(token: string, user: User): LoginResponse {
    return {
      token,
      user,
    };
  }
}
