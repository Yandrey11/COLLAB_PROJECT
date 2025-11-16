import express from "express";

import {
  getRecords,
  updateRecord,
  uploadToDrive,
  createRecord, // ✅ add this
} from "../controllers/recordController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getRecords);
router.put("/:id", protect, updateRecord);
router.post("/:id/upload-drive", protect, uploadToDrive);
router.post("/", protect, createRecord); // ✅ Require authentication to create records

export default router;
