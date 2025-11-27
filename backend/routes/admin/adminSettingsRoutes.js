import express from "express";
import {
  getSettings,
  updateDisplaySettings,
  updateNotificationSettings,
  updatePrivacySettings,
} from "../../controllers/admin/adminSettingsController.js";
import { protectAdmin } from "../../middleware/admin/adminMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

/**
 * @route   GET /api/admin/settings
 * @desc    Get all admin settings
 * @access  Private (Admin only)
 */
router.get("/", getSettings);

/**
 * @route   PUT /api/admin/settings/display
 * @desc    Update display & interface settings
 * @access  Private (Admin only)
 */
router.put("/display", updateDisplaySettings);

/**
 * @route   PUT /api/admin/settings/notifications
 * @desc    Update notification settings
 * @access  Private (Admin only)
 */
router.put("/notifications", updateNotificationSettings);

/**
 * @route   PUT /api/admin/settings/privacy
 * @desc    Update privacy settings
 * @access  Private (Admin only)
 */
router.put("/privacy", updatePrivacySettings);

export default router;


