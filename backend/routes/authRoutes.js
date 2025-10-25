// routes/authRoutes.js
import express from "express";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// ===============================
// 🧍‍♂️ SIGNUP
// ===============================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    const newUser = new User({ name, email, password }); // password will hash via Mongoose pre-save
    await newUser.save();

    res.json({ message: "Signup successful" });
  } catch (err) {
    console.error("Error in signup:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// 🔐 LOGIN
// ===============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🟢 Login request:", { email });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    console.log("✅ Login successful for:", email);
    res.status(200).json({
      token: "dummy-token", // replace with JWT later if needed
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("💥 Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
