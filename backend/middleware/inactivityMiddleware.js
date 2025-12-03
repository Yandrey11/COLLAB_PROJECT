import Session from "../models/Session.js";
import jwt from "jsonwebtoken";

// Inactivity timeout: 1 hour (60 minutes = 3600000 milliseconds)
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Middleware to check if session is still active (not inactive for more than 1 hour)
 * This should be used after protect or protectAdmin middleware
 */
export const checkInactivity = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Let other middleware handle this
    }

    const token = authHeader.split(" ")[1];
    
    // Verify token and get user info
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(); // Let other middleware handle token errors
    }

    // Find the session for this token
    const session = await Session.findOne({ 
      token: token,
      isActive: true 
    });

    if (!session) {
      // No active session found, but token might still be valid
      // Let other middleware handle this case
      return next();
    }

    // Check if session has been inactive for more than 1 hour
    const now = new Date();
    const lastActivityTime = new Date(session.lastActivity);
    const inactivityDuration = now - lastActivityTime;

    if (inactivityDuration > INACTIVITY_TIMEOUT_MS) {
      // Session has been inactive for more than 1 hour
      // Deactivate the session
      session.isActive = false;
      await session.save();

      console.log(`⚠️ Session expired due to inactivity for user: ${session.email}`);
      
      return res.status(401).json({
        success: false,
        message: "Session expired due to inactivity. Please log in again.",
        code: "SESSION_INACTIVE"
      });
    }

    // Session is still active, update lastActivity timestamp
    session.lastActivity = new Date();
    await session.save();

    // Attach session info to request
    req.session = session;
    next();
  } catch (error) {
    console.error("❌ Error checking inactivity:", error);
    // On error, allow request to continue (fail open)
    next();
  }
};

/**
 * Helper function to deactivate expired sessions (can be called from cron job)
 */
export const deactivateExpiredSessions = async () => {
  try {
    const now = new Date();
    const timeoutDate = new Date(now.getTime() - INACTIVITY_TIMEOUT_MS);

    const result = await Session.updateMany(
      {
        isActive: true,
        lastActivity: { $lt: timeoutDate }
      },
      {
        $set: { isActive: false }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Deactivated ${result.modifiedCount} expired sessions due to inactivity`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error deactivating expired sessions:", error);
    throw error;
  }
};

export default checkInactivity;


