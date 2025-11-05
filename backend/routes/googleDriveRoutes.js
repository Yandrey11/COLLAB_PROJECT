import express from "express";
import { googleDriveAuth, googleDriveCallback } from "../controllers/googleDriveAuthController.js";

const router = express.Router();

// 👉 Step 1: Start OAuth with Google Drive
router.get("/drive", googleDriveAuth);

// 👉 Step 2: Handle the OAuth callback
router.get("/drive/callback", googleDriveCallback);

export default router;
