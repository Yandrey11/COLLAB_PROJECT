import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  startGoogleCalendarOAuth,
  handleGoogleCalendarCallback,
  getDashboardCalendarEvents,
} from "../controllers/googleCalendarController.js";

const router = express.Router();

// OAuth routes don't use protect middleware - they handle auth internally
// Calendar connect route - accepts token in query parameter
router.get("/google/calendar/connect", (req, res, next) => {
  console.log("🔗 Calendar connect route hit - URL:", req.url);
  console.log("🔗 Query params:", req.query);
  next();
}, startGoogleCalendarOAuth);

router.get("/google/calendar/callback", handleGoogleCalendarCallback);
// Dashboard route uses protect middleware since it only accepts header-based auth
router.get("/dashboard/calendar-events", protect, getDashboardCalendarEvents);

export default router;
