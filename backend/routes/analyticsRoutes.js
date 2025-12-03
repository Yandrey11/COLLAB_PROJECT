import express from "express";
import { logEvent } from "../controllers/admin/analyticsController.js";

const router = express.Router();

// Public endpoint for logging events (used by frontend)
router.post("/log-event", logEvent);

export default router;

