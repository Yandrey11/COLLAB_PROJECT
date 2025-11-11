import express from "express";
import passport from "../config/passport-github.js";

const router = express.Router();

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "http://localhost:5173/login"
  }),
  function (req, res) {
    // Redirect to frontend dashboard AFTER login success
    res.redirect("http://localhost:5173/dashboard");
  }
);

export default router;
