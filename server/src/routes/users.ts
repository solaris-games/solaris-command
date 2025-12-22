import express from "express";
import { authenticateToken } from "../middleware/auth";
import { executeInTransaction } from "../db/instance";
import { UserService } from "../services/UserService";
import { UserMapper } from "../map/UserMapper";
import { ERROR_CODES } from "@solaris-command/core";

const router = express.Router();

// GET /api/v1/users/me
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await UserService.getUserById(req.user._id);

    if (!user) {
      return res.status(404).json({ errorCode: ERROR_CODES.USER_NOT_FOUND });
    }

    res.json(UserMapper.toUserDetailsResponse(user));
  } catch (error) {
    console.error("Error fetching user:", error);

    return res.status(500).json({
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
  }
});

// DELETE /api/v1/users/me
router.delete("/me", authenticateToken, async (req, res) => {
  try {
    await executeInTransaction(async (session) => {
      const result = await UserService.deleteUser(
        req.user._id,
        session
      );

      if (result.deletedCount === 0) {
        await session.abortTransaction(); // Should abort if we didn't find the user? Or just return 404?
        // Existing logic returned 404, but technically didn't abort because it happened before any writes.
        // But if we use transaction, we should be careful.
        // UserService.deleteUser does the delete first. If 0, it returns result.
        return res.status(404).json({ errorCode: ERROR_CODES.USER_NOT_FOUND });
      }
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    return res.status(500).json({
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
  }

  res.json({});
});

export default router;
