import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  handleProfilePictureUpload,
  removeProfilePicture,
  getActivityLogs,
} from "../../controllers/admin/adminProfileController.js";
import { protectAdmin } from "../../middleware/admin/adminMiddleware.js";
import { uploadProfilePicture as uploadMiddleware } from "../../middleware/uploadMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

/**
 * @route   GET /api/admin/profile
 * @desc    Get admin profile
 * @access  Private (Admin only)
 */
router.get("/", getProfile);

/**
 * @route   PUT /api/admin/profile
 * @desc    Update admin profile
 * @access  Private (Admin only)
 */
router.put("/", updateProfile);

/**
 * @route   PUT /api/admin/profile/password
 * @desc    Change admin password
 * @access  Private (Admin only)
 */
router.put("/password", changePassword);

/**
 * @route   POST /api/admin/profile/picture
 * @desc    Upload profile picture
 * @access  Private (Admin only)
 */
router.post("/picture", uploadMiddleware, handleProfilePictureUpload);

/**
 * @route   DELETE /api/admin/profile/picture
 * @desc    Remove profile picture
 * @access  Private (Admin only)
 */
router.delete("/picture", removeProfilePicture);

/**
 * @route   GET /api/admin/profile/activity
 * @desc    Get admin activity logs
 * @access  Private (Admin only)
 */
router.get("/activity", getActivityLogs);

export default router;


