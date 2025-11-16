import { deactivateSession } from "./admin/sessionController.js";

// General logout for regular users
export const logout = async (req, res) => {
  try {
    // Get token from Authorization header or request body
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") 
      ? authHeader.split(" ")[1] 
      : req.body.token;

    if (token) {
      // Deactivate the session
      await deactivateSession(token);
    }

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({ message: "Error during logout" });
  }
};

