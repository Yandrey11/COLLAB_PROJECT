import User from "../models/User.js";
import Admin from "../models/Admin.js";
import GoogleUser from "../models/GoogleUser.js";
import jwt from "jsonwebtoken";
import { validatePassword } from "../utils/passwordValidation.js";
import { createSession } from "./admin/sessionController.js";
import { createNotification } from "./admin/notificationController.js";

// ===========================
// 🔹 SIGNUP
// ===========================
export const signupUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ Check if user already exists (in any collection)
    const existingUser = await User.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });
    const existingGoogleUser = await GoogleUser.findOne({ email });
    if (existingUser || existingAdmin || existingGoogleUser)
      return res.status(400).json({ message: "Email already registered" });

    // ✅ Password strength validation
    const { isValid, errors } = validatePassword(password);
    if (!isValid) {
      return res.status(400).json({
        message: "Password does not meet the security requirements.",
        details: errors,
      });
    }

    // ✅ Create new user (password will be hashed by pre-save hook)
    const newUser = new User({ name, email, password });
    await newUser.save();

    // ✅ Create notification for admin about new account creation
    try {
      await createNotification({
        title: "New Account Created",
        description: `${newUser.name} (${newUser.email}) has created a new account with role: ${newUser.role || "counselor"}`,
        category: "User Activity",
        priority: "medium",
        metadata: {
          userId: newUser._id.toString(),
          userEmail: newUser.email,
          userName: newUser.name,
          userRole: newUser.role || "counselor",
        },
        relatedId: newUser._id.toString(),
        relatedType: "user",
      });
    } catch (notificationError) {
      console.error("⚠️ Notification creation failed (non-critical):", notificationError);
      // Continue with signup even if notification creation fails
    }

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
};

// ===========================
// 🔹 LOGIN
// ===========================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Find user by email
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    // Check if account is active
    if (user.accountStatus === "inactive") {
      return res.status(403).json({ message: "Account is inactive. Please contact an administrator." });
    }

    // ✅ Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ Create session record
    try {
      await createSession(user, token, req);
    } catch (sessionError) {
      console.error("⚠️ Session creation failed (non-critical):", sessionError);
      // Continue with login even if session creation fails
    }

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ===========================
// 🔹 GET CURRENT USER (ME)
// ===========================
export const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Get current user error:", err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res.status(500).json({ message: "Server error" });
  }
};
