import express from "express";
import {
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
  generatePDF,
  uploadToDrive,
} from "../../controllers/admin/adminRecordController.js";
import { protectAdmin } from "../../middleware/admin/adminMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

// Get all records with search, filter, and pagination
router.get("/records", getAllRecords);

// Generate PDF for a record (must come before /records/:id to avoid route conflicts)
router.get("/records/:id/pdf", generatePDF);

// Upload record PDF to Google Drive (must come before /records/:id to avoid route conflicts)
router.post("/records/:id/upload-drive", uploadToDrive);

// Get single record by ID
router.get("/records/:id", getRecordById);

// Update record
router.put("/records/:id", updateRecord);

// Delete record
router.delete("/records/:id", deleteRecord);

export default router;

