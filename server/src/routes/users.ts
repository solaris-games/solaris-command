import express from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { getDb } from "../db/instance";
import { UserService } from "../services/UserService";

const router = express.Router();

// GET /api/v1/users/me
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await UserService.getUserById(new ObjectId(req.user.id));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // TODO: Need a mapping layer

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/v1/users/me
router.delete("/me", authenticateToken, async (req, res) => {
  const db = getDb();
  const session = db.client.startSession();

  try {
    session.startTransaction();

    const result = await UserService.deleteUser(
      new ObjectId(req.user.id),
      session
    );

    if (result.deletedCount === 0) {
      await session.abortTransaction(); // Should abort if we didn't find the user? Or just return 404?
      // Existing logic returned 404, but technically didn't abort because it happened before any writes.
      // But if we use transaction, we should be careful.
      // UserService.deleteUser does the delete first. If 0, it returns result.
      return res.status(404).json({ error: "User not found" });
    }

    await session.commitTransaction();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    await session.abortTransaction();

    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await session.endSession();
  }
});

export default router;
