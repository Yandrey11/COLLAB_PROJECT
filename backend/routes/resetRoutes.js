import express from "express";
import { forgotPassword, resetPassword, setPasswordWithToken } from "../controllers/resetController.js";

const router = express.Router();

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/set-password", setPasswordWithToken);

export default router;
