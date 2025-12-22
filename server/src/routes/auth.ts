import express from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { ERROR_CODES, User, MockUnifiedId } from "@solaris-command/core";
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
    const user = await UserService.findOrCreateUser(
      email,
      googleId,
      name || email.split("@")[0]
    );

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

// POST /api/v1/auth/dev
router.post("/dev", async (req, res) => {
  if (process.env.ENABLE_DEV_AUTH !== "true") {
    return res.sendStatus(403);
  }

  const { email, username } = req.body;

  if (!email || !username) {
    return res.status(400).json({ error: "Email and username are required" });
  }

  try {
    // Generate a fake googleId
    const googleId = new MockUnifiedId().toString();

    // Find or Create User
    const user = await UserService.findOrCreateUser(email, googleId, username);

    if (!user) {
      throw new Error("Failed to find or create user");
    }

    // Issue Session JWT
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
    console.error("Dev Auth Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
