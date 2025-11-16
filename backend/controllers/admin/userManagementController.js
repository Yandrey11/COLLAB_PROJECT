import User from "../../models/User.js";
import GoogleUser from "../../models/GoogleUser.js";
import Admin from "../../models/Admin.js";
import Session from "../../models/Session.js";
import bcrypt from "bcryptjs";
import { createNotification } from "./notificationController.js";

// Get all users with filters and pagination
export const getAllUsers = async (req, res) => {
  try {
    console.log("📥 getAllUsers called with query:", req.query);
    const { page = 1, limit = 10, search = "", role = "all", status = "all" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {};
    
    // Handle search
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    // Handle role filter
    if (role !== "all") {
      query.role = role;
    }

    // Note: We don't filter by accountStatus in the query anymore
    // Status filter will be applied after checking online status

    console.log("🔍 MongoDB query:", JSON.stringify(query, null, 2));

    // Get regular users
    const regularUsers = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    // Get Google users (apply same filters where applicable)
    const googleUsersQuery = {};
    if (search) {
      googleUsersQuery.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }
    // Google users don't have role field, so we only filter by role if it's "all" or we want to include them
    // For now, include all Google users when role is "all" or "user"
    const googleUsers = role === "all" || role === "user" 
      ? await GoogleUser.find(googleUsersQuery)
          .sort({ createdAt: -1 })
          .lean()
      : [];

    // Get admins (apply same filters where applicable)
    const adminQuery = {};
    if (search) {
      adminQuery.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }
    // Admins have role "admin", so include them when role is "all" or "admin"
    const admins = role === "all" || role === "admin"
      ? await Admin.find(adminQuery)
          .select("-password")
          .sort({ createdAt: -1 })
          .lean()
      : [];

    // Combine all user types
    const allUsers = [
      ...regularUsers.map(u => ({ ...u, userType: "regular" })),
      ...googleUsers.map(u => ({ ...u, userType: "google" })),
      ...admins.map(u => ({ ...u, userType: "admin" }))
    ];

    console.log(`✅ Found ${regularUsers.length} regular users, ${googleUsers.length} Google users, and ${admins.length} admins`);

    // Get all active sessions to determine online status
    const activeSessions = await Session.find({ isActive: true }).select("userId email").lean();
    
    // Create sets for quick lookup
    const onlineUserIds = new Set();
    const onlineUserEmails = new Set();
    
    // Populate sets with active session data
    activeSessions.forEach(session => {
      if (session.userId) {
        onlineUserIds.add(session.userId.toString());
      }
      if (session.email) {
        onlineUserEmails.add(session.email.toLowerCase());
      }
    });

    console.log(`📊 Active sessions: ${activeSessions.length} total`);
    console.log(`📊 Online user IDs: ${onlineUserIds.size}, Online emails: ${onlineUserEmails.size}`);

    // Format response with online/offline status
    let formattedUsers = allUsers.map((user) => {
      const userId = user._id.toString();
      const userEmail = user.email?.toLowerCase();
      
      // Check online status:
      // - For regular users and admins: check by userId
      // - For Google users: check by email (since they might not have userId in sessions)
      // - Also check by email as fallback for all user types
      const isOnlineByUserId = onlineUserIds.has(userId);
      const isOnlineByEmail = userEmail && onlineUserEmails.has(userEmail);
      const isOnline = isOnlineByUserId || isOnlineByEmail;
      
      return {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role || "user", // Google users default to "user", admins have "admin"
        accountStatus: user.accountStatus || "active", // Keep for enable/disable functionality
        isOnline: isOnline, // true if user has at least one active session
        status: isOnline ? "active" : "offline", // Display status: "active" (online) or "offline"
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        userType: user.userType || "regular", // Track user type: "regular", "google", or "admin"
      };
    });

    // Filter by online/offline status if specified
    if (status === "active") {
      formattedUsers = formattedUsers.filter(user => user.isOnline === true);
    } else if (status === "offline") {
      formattedUsers = formattedUsers.filter(user => user.isOnline === false);
    }
    // If status is "all", show all users

    // Get total count after filtering
    const total = formattedUsers.length;

    // Apply pagination after filtering
    const paginatedUsers = formattedUsers.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      users: paginatedUsers,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Error fetching users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Create a new user
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Role validation
    const validRoles = ["user", "counselor", "admin"];
    const userRole = role || "user";
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be: user, counselor, or admin" });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check for duplicate email in both User and Admin collections
    const existingUser = await User.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });
    if (existingUser || existingAdmin) {
      return res.status(400).json({ message: "Email already exists" });
    }

    let newAccount;
    let accountType;

    // Save to appropriate collection based on role
    if (userRole === "admin") {
      // Save to Admin collection
      newAccount = new Admin({
        name,
        email,
        password, // Will be hashed by pre-save hook
        role: "admin",
      });
      await newAccount.save();
      accountType = "admin";
    } else {
      // Save to User collection (for "user" or "counselor" roles)
      newAccount = new User({
        name,
        email,
        password, // Will be hashed by pre-save hook
        role: userRole,
        accountStatus: "active",
      });
      await newAccount.save();
      accountType = "user";
    }

    // Create notification
    try {
      await createNotification({
        title: `New ${accountType === "admin" ? "Admin" : "User"} Created`,
        description: `Admin created a new ${accountType === "admin" ? "admin" : "user"} account: ${email} (Role: ${userRole})`,
        category: "User Activity",
        priority: "medium",
        metadata: { 
          userId: newAccount._id, 
          createdBy: req.admin._id,
          accountType,
          role: userRole,
        },
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    res.status(201).json({
      message: `${accountType === "admin" ? "Admin" : "User"} created successfully`,
      user: {
        id: newAccount._id,
        name: newAccount.name,
        email: newAccount.email,
        role: newAccount.role || userRole,
        accountStatus: newAccount.accountStatus || "active",
      },
    });
  } catch (error) {
    console.error("❌ Error creating user:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Error creating user" });
  }
};

// Update user information
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    // Check all collections: User, GoogleUser, Admin
    let user = await User.findById(userId);
    let userType = "regular";
    
    if (!user) {
      user = await GoogleUser.findById(userId);
      userType = "google";
    }
    
    if (!user) {
      user = await Admin.findById(userId);
      userType = "admin";
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Email validation if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check for duplicate email across all collections (excluding current user)
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      const existingGoogleUser = await GoogleUser.findOne({ email, _id: { $ne: userId } });
      const existingAdmin = await Admin.findOne({ email, _id: { $ne: userId } });
      
      if (existingUser || existingGoogleUser || existingAdmin) {
        return res.status(400).json({ message: "Email already exists" });
      }
      user.email = email;
    }

    // Update fields
    if (name) user.name = name;
    
    // Role can only be updated for regular users and admins (not Google users)
    if (role) {
      if (userType === "google") {
        return res.status(400).json({ message: "Cannot update role for Google-authenticated users" });
      }
      
      const validRoles = ["user", "counselor", "admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // If changing to admin role, need to move to Admin collection
      // If changing from admin to user/counselor, need to move to User collection
      if (userType === "admin" && role !== "admin") {
        // Move from Admin to User collection
        const newUser = new User({
          name: user.name,
          email: user.email,
          password: user.password, // Keep existing password
          role: role,
          accountStatus: "active",
        });
        await newUser.save();
        await Admin.findByIdAndDelete(userId);
        user = newUser;
        userType = "regular";
      } else if (userType === "regular" && role === "admin") {
        // Move from User to Admin collection
        const newAdmin = new Admin({
          name: user.name,
          email: user.email,
          password: user.password, // Keep existing password
          role: "admin",
        });
        await newAdmin.save();
        await User.findByIdAndDelete(userId);
        user = newAdmin;
        userType = "admin";
      } else {
        // Just update role in same collection
        user.role = role;
      }
    }
    // Note: accountStatus is no longer editable - status is based on active sessions

    await user.save();

    // Create notification
    try {
      await createNotification({
        title: "User Updated",
        description: `Admin updated user account: ${user.email}`,
        category: "User Activity",
        priority: "medium",
        metadata: { userId: user._id, updatedBy: req.admin._id, userType },
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || (userType === "google" ? "user" : userType === "admin" ? "admin" : "user"),
      },
    });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({ message: "Error updating user" });
  }
};

// Toggle user account status (activate/deactivate)
export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deactivating yourself
    if (user._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }

    // Toggle status
    user.accountStatus = user.accountStatus === "active" ? "inactive" : "active";
    await user.save();

    // Create notification
    try {
      await createNotification({
        title: `User Account ${user.accountStatus === "active" ? "Activated" : "Deactivated"}`,
        description: `Admin ${user.accountStatus === "active" ? "activated" : "deactivated"} user account: ${user.email}`,
        category: "User Activity",
        priority: user.accountStatus === "inactive" ? "high" : "medium",
        metadata: { userId: user._id, actionBy: req.admin._id },
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    res.status(200).json({
      message: `User account ${user.accountStatus === "active" ? "activated" : "deactivated"} successfully`,
      user: {
        id: user._id,
        email: user.email,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    console.error("❌ Error toggling user status:", error);
    res.status(500).json({ message: "Error updating user status" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check all collections: User, GoogleUser, Admin
    let user = await User.findById(userId);
    let userType = "regular";
    let collection = User;
    
    if (!user) {
      user = await GoogleUser.findById(userId);
      userType = "google";
      collection = GoogleUser;
    }
    
    if (!user) {
      user = await Admin.findById(userId);
      userType = "admin";
      collection = Admin;
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const userEmail = user.email;

    // Delete user from the appropriate collection
    await collection.findByIdAndDelete(userId);

    // Also deactivate all sessions for this user
    try {
      await Session.updateMany(
        { 
          $or: [
            { userId: userId },
            { email: userEmail.toLowerCase() }
          ]
        },
        { isActive: false }
      );
    } catch (sessionError) {
      console.error("Failed to deactivate sessions:", sessionError);
    }

    // Create notification
    try {
      await createNotification({
        title: "User Deleted",
        description: `Admin deleted ${userType} account: ${userEmail}`,
        category: "User Activity",
        priority: "high",
        metadata: { deletedUserId: userId, deletedBy: req.admin._id, userType },
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    res.status(200).json({
      message: "User deleted successfully",
      deletedUserId: userId,
    });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ message: "Error deleting user" });
  }
};

// Reset user password (admin-initiated)
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check all collections: User, GoogleUser, Admin
    let user = await User.findById(userId);
    let userType = "regular";
    
    if (!user) {
      user = await GoogleUser.findById(userId);
      userType = "google";
    }
    
    if (!user) {
      user = await Admin.findById(userId);
      userType = "admin";
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Google users don't have passwords (they use OAuth)
    if (userType === "google") {
      return res.status(400).json({ 
        message: "Cannot reset password for Google-authenticated users. They use Google OAuth for login." 
      });
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Create notification
    try {
      await createNotification({
        title: "Password Reset",
        description: `Admin reset password for ${userType} account: ${user.email}. User should change password on next login.`,
        category: "Security Alert",
        priority: "high",
        metadata: { userId: user._id, resetBy: req.admin._id, userType },
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    res.status(200).json({
      message: "Password reset successfully. User will need to use the new password on next login.",
      userId: user._id,
    });
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};

