import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ERROR_CODES } from "./error-codes";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        email: string;
        username: string;
      };
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

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.error("JWT Verification Error:", err);
      return res.sendStatus(403);
    }

    if (!user)
      return res.status(401).json({ errorCode: ERROR_CODES.USER_UNAUTHORIZED });

    req.user = user;

    next();
  });
};
