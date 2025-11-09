// routes/reportRoutes.js
import express from "express";
import {
  getReports,
  generateReport,
  getClientReport,
} from "../controllers/reportController.js";

const router = express.Router();

router.get("/", getReports); // List all reports (with filters)
router.post("/generate", generateReport); // Generate report for a client
router.get("/:clientName", getClientReport); // Get single client report

export default router;
