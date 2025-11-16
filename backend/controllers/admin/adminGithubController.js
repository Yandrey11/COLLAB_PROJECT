// controllers/admin/adminGithubController.js
import jwt from "jsonwebtoken";
import Admin from "../../models/Admin.js";
import { deactivateSession, deactivateAllUserSessions } from "./sessionController.js";

export const githubLoginSuccess = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const admin = req.user;
    const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${process.env.CLIENT_URL}/admin/dashboard`);
  } catch (error) {
    console.error("GitHub login success error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const token = req.cookies.adminToken;
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json(admin);
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const logoutAdmin = async (req, res) => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.adminToken || 
                  (req.headers.authorization?.startsWith("Bearer ") 
                    ? req.headers.authorization.split(" ")[1] 
                    : null);

    // Deactivate session if token exists
    if (token) {
      await deactivateSession(token);
    }

    // Also try to deactivate by admin ID if available
    if (req.user?._id) {
      await deactivateAllUserSessions(req.user._id, req.user.email);
    }

    res.clearCookie("adminToken");
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("❌ Admin logout error:", error);
    res.clearCookie("adminToken");
    res.json({ message: "Logged out successfully" });
  }
};


export const githubCallback = (req, res) => {
  // Generate token or set cookie for persistent login
  const admin = req.user;

  res.cookie("adminToken", admin._id, {
    httpOnly: true,
    secure: false, // change to true in production
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    message: "✅ GitHub Admin login successful",
    admin,
  });
};
