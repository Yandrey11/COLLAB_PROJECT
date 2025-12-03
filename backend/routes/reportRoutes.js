// routes/reportRoutes.js
import express from "express";
import {
  getReports,
  generateReport,
  getClientReport,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize, authorizeAll } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// List all reports - requires can_view_reports permission
router.get("/", protect, authorize("can_view_reports"), getReports);

// Generate report - requires can_generate_reports permission
router.post("/generate", protect, authorize("can_generate_reports"), generateReport);

// Get single client report - requires can_view_reports permission
router.get("/:clientName", protect, authorize("can_view_reports"), getClientReport);

export default router;
