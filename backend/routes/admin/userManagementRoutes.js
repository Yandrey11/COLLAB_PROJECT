import express from "express";
import {
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  resetUserPassword,
} from "../../controllers/admin/userManagementController.js";
import { protectAdmin } from "../../middleware/admin/adminMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

// Get all users with filters and pagination
router.get("/users", getAllUsers);

// Create a new user
router.post("/users", createUser);

// Update user information
router.put("/users/:userId", updateUser);

// Toggle user account status (activate/deactivate)
router.patch("/users/:userId/status", toggleUserStatus);

// Delete user
router.delete("/users/:userId", deleteUser);

// Reset user password (admin-initiated)
router.post("/users/:userId/reset-password", resetUserPassword);

export default router;

