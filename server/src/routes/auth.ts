import express from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { ERROR_CODES, User } from "@solaris-command/core";
import { UserService } from "../services/UserService";
import { AuthMapper } from "../map/AuthMapper";
import { Types } from "mongoose";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me";

// POST /api/v1/auth/google
router.post("/google", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res
      .status(400)
      .json({ errorCode: ERROR_CODES.AUTH_TOKEN_MISSING_ID });
  }

  try {
    // 1. Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res
        .status(400)
        .json({ errorCode: ERROR_CODES.AUTH_INVALID_GOOGLE_TOKEN });
    }

    const { email, sub: googleId, name } = payload;

    // 2. Find or Create User
    // Note: User interface in core/src/models/user.ts defines structure
    // We might need to adjust the schema or just use a basic one for now.
    // The core definition has _id, username, email, lastSeenDate, achievements

    let user = await UserService.getUserByEmail(email);

    if (!user) {
      // Create new user
      const newUser: User = {
        _id: new Types.ObjectId(),
        googleId, // Store googleId for reference, though email is unique key usually
        email,
        username: name || email.split("@")[0], // TODO: Username in request?
        lastSeenDate: new Date(),
        achievements: {
          victories: 0,
          rank: 0,
          renown: 0,
        },
      };

      user = await UserService.createUser(newUser)
    } else {
      // Update last seen
      await UserService.touchUser(user._id);
    }

    if (!user) {
      throw new Error("Failed to find or create user");
    }

    // 3. Issue Session JWT
    const sessionToken = jwt.sign(
      {
        id: String(user._id),
        email: user.email,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: "7d" } // Long lived session
    );

    res.json(AuthMapper.toLoginResponse(sessionToken, user));
  } catch (error) {
    console.error("Auth Error:", error);
    
    return res.status(401).json({ errorCode: ERROR_CODES.AUTH_FAILED });
  }
});

export default router;
