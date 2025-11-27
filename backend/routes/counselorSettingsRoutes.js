import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getSettings,
  updateSettings,
  resetSettings,
} from "../controllers/counselorSettingsController.js";

const router = express.Router();

router.route("/").get(protect, getSettings).put(protect, updateSettings);
router.post("/reset", protect, resetSettings);

export default router;

