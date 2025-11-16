import express from "express";
import {
  getActiveSessions,
  forceLogout,
  getSessionSettings,
  updateSessionSettings,
} from "../../controllers/admin/sessionController.js";
import { protectAdmin } from "../../middleware/admin/adminMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

// Get all active sessions with pagination and filters
router.get("/sessions", getActiveSessions);

// Force logout a specific session
router.post("/sessions/:sessionId/logout", forceLogout);

// Get session timeout settings
router.get("/sessions/settings", getSessionSettings);

// Update session timeout settings
router.put("/sessions/settings", updateSessionSettings);

export default router;

