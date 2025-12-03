import express from "express";
import {
  createBackup,
  getAllBackups,
  getBackupById,
  restoreBackup,
  deleteBackup,
} from "../../controllers/admin/backupController.js";
import { protectAdmin } from "../../middleware/admin/adminMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

// Create a new backup
router.post("/", createBackup);

// Get all backups with pagination
router.get("/", getAllBackups);

// Get single backup by ID
router.get("/:backupId", getBackupById);

// Restore from backup
router.post("/:backupId/restore", restoreBackup);

// Delete backup
router.delete("/:backupId", deleteBackup);

export default router;

