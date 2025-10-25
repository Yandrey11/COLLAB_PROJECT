import express from "express";
import passport from "passport";
import "../config/passport.js";
import { googleAuthSuccess, googleAuthFailure } from "../controllers/googleAuthController.js";

const router = express.Router();

// Start Google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback from Google
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/google/failure" }),
  googleAuthSuccess
);

// Failure route
router.get("/google/failure", googleAuthFailure);

// (Optional) simple test route
router.get("/test", (req, res) => res.send("✅ Google Auth Route Working"));

export default router;
