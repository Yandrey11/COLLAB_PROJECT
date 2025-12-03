import express from "express";

import {
  getRecords,
  updateRecord,
  uploadToDrive,
  createRecord,
  deleteRecord, // ✅ add delete function
  generateRecordPDF, // ✅ add PDF generation function
} from "../controllers/recordController.js";
import {
  lockRecord,
  unlockRecord,
  getLockStatus,
  getLockLogs,
  checkLockBeforeUpdate,
} from "../controllers/admin/recordLockController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/permissionMiddleware.js";

const router = express.Router();

// View records - requires can_view_records permission
router.get("/", protect, authorize("can_view_records"), getRecords);

// Generate PDF for a single record - requires can_view_records permission
router.get("/:id/generate-pdf", protect, authorize("can_view_records"), generateRecordPDF);

// Lock/Unlock routes (for counselors) - requires can_view_records
router.post("/:id/lock", protect, authorize("can_view_records"), lockRecord);
router.post("/:id/unlock", protect, authorize("can_view_records"), unlockRecord);
router.get("/:id/lock-status", protect, authorize("can_view_records"), getLockStatus);
router.get("/:id/lock-logs", protect, authorize("can_view_records"), getLockLogs);

// Edit/Update records - requires can_edit_records permission
router.put("/:id", protect, authorize("can_edit_records"), checkLockBeforeUpdate, updateRecord);
router.post("/:id/upload-drive", protect, authorize("can_edit_records"), uploadToDrive);
router.post("/", protect, authorize("can_edit_records"), createRecord); // ✅ Require authentication and permission to create records
router.delete("/:id", protect, authorize("can_edit_records"), deleteRecord); // ✅ Require permission to delete records

export default router;
