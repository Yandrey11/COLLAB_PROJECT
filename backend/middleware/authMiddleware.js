import jwt from "jsonwebtoken";
import User from "../models/User.js";
import GoogleUser from "../models/GoogleUser.js";

// ✅ Verify JWT and attach user to request
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try to find user in User collection first
    let user = await User.findById(decoded.id).select("-password");
    
    // If not found, try GoogleUser collection (for Google OAuth users)
    if (!user) {
      const googleUser = await GoogleUser.findById(decoded.id);
      if (googleUser) {
        // Convert GoogleUser to user-like object for compatibility, including calendar tokens
        user = {
          _id: googleUser._id,
          id: googleUser._id, // Add id for compatibility
          name: googleUser.name,
          email: googleUser.email,
          role: googleUser.role || "counselor",
          googleId: googleUser.googleId,
          googleCalendarAccessToken: googleUser.googleCalendarAccessToken || null,
          googleCalendarRefreshToken: googleUser.googleCalendarRefreshToken || null,
          googleCalendarTokenExpires: googleUser.googleCalendarTokenExpires || null,
        };
      }
    } else if (user && !user.googleCalendarAccessToken) {
      // If user is from User collection but has googleId, check GoogleUser for calendar tokens
      if (user.googleId) {
        const googleUser = await GoogleUser.findOne({ googleId: user.googleId });
        if (googleUser && googleUser.googleCalendarAccessToken) {
          // Merge calendar tokens into user object
          user.googleCalendarAccessToken = googleUser.googleCalendarAccessToken;
          user.googleCalendarRefreshToken = googleUser.googleCalendarRefreshToken;
          user.googleCalendarTokenExpires = googleUser.googleCalendarTokenExpires;
        }
      }
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ✅ Allow access only if user role is "admin"
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};
