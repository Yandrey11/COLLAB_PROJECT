import express from "express";
import { signup } from "../controllers/signupController.js";
import { login } from "../controllers/loginController.js";
import { logout } from "../controllers/logoutController.js";
import { getCurrentUser } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", getCurrentUser); // Get current authenticated user

export default router;
