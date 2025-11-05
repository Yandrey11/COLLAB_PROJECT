import express from "express";
import passport from "passport";
import { adminGoogleAuthSuccess, adminGoogleAuthFailure } from "../../controllers/admin/adminGoogleAuthController.js";

const router = express.Router();

// 👇 must use "admin-google" (same name)
router.get(
  "/google",
  passport.authenticate("admin-google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("admin-google", {
    failureRedirect: "http://localhost:5173/adminlogin?error=google_auth_failed",
  }),
  adminGoogleAuthSuccess
);

router.get("/failure", adminGoogleAuthFailure);

export default router;
