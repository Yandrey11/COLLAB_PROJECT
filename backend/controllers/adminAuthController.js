import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" });
const generateRefreshToken = (id) => jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

// 🧩 Admin Signup (manual)
export const adminSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ message: "Admin already exists" });

    const admin = await Admin.create({ name, email, password });
    res.status(201).json({ message: "Admin created successfully", admin });
  } catch (err) {
    console.error("❌ Admin Signup Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🧩 Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateToken(admin._id);
    const refreshToken = generateRefreshToken(admin._id);
    admin.refreshToken = refreshToken;
    await admin.save();

    res.json({
      message: "✅ Admin login successful",
      accessToken,
      refreshToken,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    console.error("❌ Admin Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
