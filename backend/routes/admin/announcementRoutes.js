import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  deactivateAnnouncement,
} from "../../controllers/admin/announcementController.js";
import { protectAdmin } from "../../middleware/admin/adminMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

// Create and send announcement to counselors
router.post("/announcements", createAnnouncement);

// Get all announcements
router.get("/announcements", getAnnouncements);

// Deactivate announcement
router.put("/announcements/:id/deactivate", deactivateAnnouncement);

export default router;

