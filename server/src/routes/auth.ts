import express from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { ERROR_CODES, MockUnifiedId } from "@solaris-command/core";
import { UserService } from "../services/UserService";
import { AuthMapper } from "../map/AuthMapper";
import axios from "axios";

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
      null,
      name || email.split("@")[0],
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
      { expiresIn: "7d" }, // Long lived session
    );

    res.json(AuthMapper.toLoginResponse(sessionToken, user));
  } catch (error) {
    console.error("Auth Error:", error);

    return res.status(401).json({ errorCode: ERROR_CODES.AUTH_FAILED });
  }
});

// POST /api/v1/auth/discord
router.post("/discord", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    const redirectUri = process.env.DISCORD_REDIRECT_URI;

    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    // Exchange Code for Token
    const response = await axios.post(
      "https://discord.com/api/oauth2/token",
      params,
      { headers },
    );

    const { access_token } = response.data;

    // Fetch User Profile
    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { id: discordId, username, email } = userResponse.data;

    // Verify Email Existence (Discord allows accounts without emails)
    if (!email) {
      return res
        .status(400)
        .json({ error: "Discord account must have a verified email" });
    }

    const user = await UserService.findOrCreateUser(
      email,
      null, // Google ID is null
      discordId,
      username,
    );

    if (!user) {
      throw new Error("Failed to find or create user");
    }

    const sessionToken = jwt.sign(
      {
        id: String(user._id),
        email: user.email,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json(AuthMapper.toLoginResponse(sessionToken, user));
  } catch (error) {
    console.error("Discord Auth Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Internal Server Error" });
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
    // Generate fake IDs
    const googleId = new MockUnifiedId().toString();
    const discordId = new MockUnifiedId().toString();

    // Find or Create User
    const user = await UserService.findOrCreateUser(
      email,
      googleId,
      discordId,
      username,
    );

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
      { expiresIn: "7d" }, // Long lived session
    );

    res.json(AuthMapper.toLoginResponse(sessionToken, user));
  } catch (error) {
    console.error("Dev Auth Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
