import express from "express";
import { adminSignup } from "../../controllers/admin/adminSignupController.js";

const router = express.Router();

router.post("/signup", adminSignup);

export default router;
