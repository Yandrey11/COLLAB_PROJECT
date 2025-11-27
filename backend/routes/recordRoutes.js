import express from "express";

import {
  getRecords,
  updateRecord,
  uploadToDrive,
  createRecord,
  deleteRecord, // ✅ add delete function
} from "../controllers/recordController.js";
import {
  lockRecord,
  unlockRecord,
  getLockStatus,
  getLockLogs,
  checkLockBeforeUpdate,
} from "../controllers/admin/recordLockController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getRecords);

// Lock/Unlock routes (for counselors)
router.post("/:id/lock", protect, lockRecord);
router.post("/:id/unlock", protect, unlockRecord);
router.get("/:id/lock-status", protect, getLockStatus);
router.get("/:id/lock-logs", protect, getLockLogs);

router.put("/:id", protect, checkLockBeforeUpdate, updateRecord);
router.post("/:id/upload-drive", protect, uploadToDrive);
router.post("/", protect, createRecord); // ✅ Require authentication to create records
router.delete("/:id", protect, deleteRecord); // ✅ Allow counselors to delete their own records

export default router;
