import express from "express";
import passport from "../config/githubPassport.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login/failed" }),
  (req, res) => {
    // Generate a JWT token
    const token = jwt.sign(
      {
        id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/dashboard?token=${token}`);
  }
);

export default router;
