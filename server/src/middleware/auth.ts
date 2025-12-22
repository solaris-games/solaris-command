import { ERROR_CODES, User } from "@solaris-command/core";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserService } from "../services";
import { Types } from "mongoose";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
    if (err) {
      console.error("JWT Verification Error:", err);
      return res.sendStatus(403);
    }

    if (!user)
      return res.status(401).json({ errorCode: ERROR_CODES.USER_UNAUTHORIZED });

    // Double check the user exists in the DB.
    const dbUser = await UserService.getUserById(new Types.ObjectId(user.id));

    if (dbUser == null)
      return res.status(401).json({ errorCode: ERROR_CODES.USER_UNAUTHORIZED });

    req.user = dbUser;

    next();
  });
};
