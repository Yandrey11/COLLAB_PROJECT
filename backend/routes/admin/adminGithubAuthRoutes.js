// routes/admin/adminGithubAuthRoutes.js
import express from "express";
import passport from "passport";
import "../../config/adminGithubPassport.js";
import {
  githubLoginSuccess,
  getAdminProfile,
  logoutAdmin,
} from "../../controllers/admin/adminGithubController.js";

const router = express.Router();

// Start GitHub login flow
router.get(
  "/github",
  passport.authenticate("admin-github", { scope: ["user:email"] })
);

// GitHub callback
router.get(
  "/github/callback",
  passport.authenticate("admin-github", { failureRedirect: "/login" }),
  githubLoginSuccess
);

// Get logged-in admin profile (persistent login)
router.get("/profile", getAdminProfile);

// Logout
router.post("/logout", logoutAdmin);

export default router;
