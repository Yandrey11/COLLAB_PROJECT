// controllers/adminGoogleAuthController.js
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const adminGoogleAuthSuccess = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("http://localhost:5173/adminlogin?error=unauthorized");
    }

    const admin = await Admin.findById(req.user._id);

    if (!admin || admin.role !== "admin") {
      console.warn(`🚫 Unauthorized Google login attempt: ${req.user.email}`);
      return res.redirect("http://localhost:5173/login?error=not_admin");
    }

    // ✅ Include role explicitly in token
    const token = jwt.sign(
      {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log(`✅ Admin Google login success: ${admin.email}`);
    res.redirect(`http://localhost:5173/admindashboard?token=${token}`);
  } catch (error) {
    console.error("❌ Error in adminGoogleAuthSuccess:", error);
    res.redirect("http://localhost:5173/adminlogin?error=server_error");
  }
};

// ✅ This was missing!
export const adminGoogleAuthFailure = (req, res) => {
  console.warn("❌ Admin Google authentication failed");
  res.redirect("http://localhost:5173/adminlogin?error=google_auth_failed");
};
