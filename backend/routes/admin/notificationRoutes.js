import express from "express";
import {
  getNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
} from "../../controllers/admin/notificationController.js";
import { protectAdmin } from "../../middleware/admin/adminMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

// Get all notifications with filters and pagination
router.get("/notifications", getNotifications);

// Mark notification as read
router.put("/notifications/:notificationId/read", markAsRead);

// Mark notification as unread
router.put("/notifications/:notificationId/unread", markAsUnread);

// Mark all notifications as read
router.put("/notifications/read-all", markAllAsRead);

// Delete a notification
router.delete("/notifications/:notificationId", deleteNotification);

// Delete all read notifications
router.delete("/notifications/read/all", deleteAllRead);

export default router;

