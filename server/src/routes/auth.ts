import express from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { getDb } from "../db/instance";
import { User } from "@solaris-command/core";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me";

// POST /api/v1/auth/google
router.post("/google", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "Missing idToken" });
  }

  try {
    // 1. Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Invalid Google Token" });
    }

    const { email, sub: googleId, name } = payload;
    const db = getDb();

    // 2. Find or Create User
    // Note: User interface in core/src/models/user.ts defines structure
    // We might need to adjust the schema or just use a basic one for now.
    // The core definition has _id, username, email, lastSeenDate, lastSeenIP, achievements

    let user = await db.collection<User>("users").findOne({ email });

    if (!user) {
      // Create new user
      const newUser = {
        email,
        username: name || email.split("@")[0],
        googleId, // Store googleId for reference, though email is unique key usually
        lastSeenDate: new Date(),
        lastSeenIP: req.ip,
        achievements: {
          victories: 0,
          rank: 0,
          renown: 0,
        },
        createdAt: new Date(),
      };

      const result = await db.collection("users").insertOne(newUser);
      // user = { ...newUser, _id: result.insertedId } as User; // Casting
      // Re-fetch to be safe
      user = await db.collection<User>("users").findOne({ _id: result.insertedId });
    } else {
      // Update last seen
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            lastSeenDate: new Date(),
            lastSeenIP: req.ip,
          },
        }
      );
    }

    if (!user) {
        throw new Error("Failed to find or create user");
    }

    // 3. Issue Session JWT
    const sessionToken = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: "7d" } // Long lived session
    );

    res.json({ token: sessionToken, user });
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
});

export default router;
