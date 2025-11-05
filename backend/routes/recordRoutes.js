import express from "express";

import {
  getRecords,
  updateRecord,
  uploadToDrive,
  createRecord, // ✅ add this
} from "../controllers/recordController.js";
const router = express.Router();

router.get("/", getRecords);
router.put("/:id", updateRecord);
router.post("/:id/upload-drive", uploadToDrive);
router.post("/", createRecord); // ✅ add this

export default router;
