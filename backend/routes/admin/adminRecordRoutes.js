import express from "express";
import {
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} from "../../controllers/admin/adminRecordController.js";
import { protectAdmin } from "../../middleware/admin/adminMiddleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(protectAdmin);

// Get all records with search, filter, and pagination
router.get("/records", getAllRecords);

// Get single record by ID
router.get("/records/:id", getRecordById);

// Update record
router.put("/records/:id", updateRecord);

// Delete record
router.delete("/records/:id", deleteRecord);

export default router;

