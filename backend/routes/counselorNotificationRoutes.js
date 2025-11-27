import express from "express";
import {
  getCounselorNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
} from "../controllers/counselorNotificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication (counselor/admin authentication)
router.use(protect);

// Get all notifications for the authenticated counselor with filters and pagination
router.get("/", getCounselorNotifications);

// Get unread count only (for badge)
router.get("/unread-count", getUnreadCount);

// Mark notification as read
router.put("/:notificationId/read", markAsRead);

// Mark notification as unread
router.put("/:notificationId/unread", markAsUnread);

// Mark all notifications as read for this counselor
router.put("/read-all", markAllAsRead);

// Delete a notification
router.delete("/:notificationId", deleteNotification);

// Delete all read notifications for this counselor
router.delete("/read/all", deleteAllRead);

export default router;

