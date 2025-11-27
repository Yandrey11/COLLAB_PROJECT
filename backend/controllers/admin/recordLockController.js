import Record from "../../models/Record.js";
import RecordLock from "../../models/RecordLock.js";
import LockAuditLog from "../../models/LockAuditLog.js";
import { createNotification } from "./notificationController.js";
import { createCounselorNotification } from "../counselorNotificationController.js";
import Admin from "../../models/Admin.js";
import User from "../../models/User.js";

/**
 * Helper to get user info from request
 */
const getUserInfo = (req) => {
  const isAdmin = !!req.admin;
  return {
    userId: isAdmin ? req.admin._id : req.user._id,
    userName: isAdmin ? req.admin.name : req.user.name,
    userRole: isAdmin ? "admin" : "counselor",
    userEmail: isAdmin ? req.admin.email : req.user.email,
  };
};

/**
 * Helper to log lock action
 */
const logLockAction = async (recordId, action, performedBy, lockOwner = null, reason = null, metadata = {}) => {
  try {
    await LockAuditLog.create({
      recordId,
      action,
      performedBy,
      lockOwner,
      reason,
      metadata,
    });
  } catch (error) {
    console.error("Error logging lock action:", error);
    // Don't throw - logging failure shouldn't break the operation
  }
};

/**
 * Clean up expired locks (can be called periodically)
 */
export const cleanupExpiredLocks = async () => {
  try {
    const expiredLocks = await RecordLock.find({
      isActive: true,
      expiresAt: { $lt: new Date() },
    });

    for (const lock of expiredLocks) {
      // Log the expiration before deleting
      await logLockAction(
        lock.recordId,
        "LOCK_EXPIRED",
        {
          userId: lock.lockedBy.userId,
          userName: lock.lockedBy.userName,
          userRole: lock.lockedBy.userRole,
          userEmail: lock.lockedBy.userEmail,
        },
        lock.lockedBy,
        "Lock expired after 24 hours"
      );
      
      // Delete expired locks instead of marking inactive to prevent duplicate key errors
      await RecordLock.deleteOne({ _id: lock._id });
    }

    return expiredLocks.length;
  } catch (error) {
    console.error("Error cleaning up expired locks:", error);
    throw error;
  }
};

/**
 * Check if user can lock a record
 * - Admin can lock any record
 * - Counselor can only lock their own records
 */
const canUserLockRecord = async (userInfo, record) => {
  if (userInfo.userRole === "admin") {
    return { canLock: true };
  }

  // Counselor can only lock records they created
  if (userInfo.userRole === "counselor") {
    const isOwner = record.auditTrail?.createdBy?.userId?.toString() === userInfo.userId.toString();
    if (!isOwner) {
      return {
        canLock: false,
        reason: "You can only lock records that you created.",
      };
    }
    return { canLock: true };
  }

  return { canLock: false, reason: "Unauthorized to lock records." };
};

/**
 * Lock a record (Admin or Counselor)
 * POST /api/admin/records/:id/lock
 * POST /api/records/:id/lock
 */
export const lockRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userInfo = getUserInfo(req);

    // Find the record
    const record = await Record.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }

    // Check if user can lock this record
    const lockPermission = await canUserLockRecord(userInfo, record);
    if (!lockPermission.canLock) {
      await logLockAction(
        id,
        "LOCK_ATTEMPT_BLOCKED",
        userInfo,
        null,
        lockPermission.reason
      );
      return res.status(403).json({
        success: false,
        message: lockPermission.reason,
      });
    }

    // Check if record is already locked (check for any lock, active or inactive)
    const existingLock = await RecordLock.findOne({
      recordId: id,
    });

    if (existingLock) {
      // Check if lock is expired or inactive
      if (existingLock.isExpired() || !existingLock.isActive) {
        // Delete expired/inactive lock to allow new lock creation
        await RecordLock.deleteOne({ _id: existingLock._id });
      } else {
        // Record is actively locked by someone else
        const lockOwner = existingLock.lockedBy;
        await logLockAction(
          id,
          "LOCK_ATTEMPT_BLOCKED",
          userInfo,
          lockOwner,
          `Record is currently locked by ${lockOwner.userName}.`
        );

        return res.status(423).json({
          success: false,
          message: `Record is currently locked by ${lockOwner.userName}.`,
          lockedBy: {
            userId: lockOwner.userId,
            userName: lockOwner.userName,
            userRole: lockOwner.userRole,
          },
          lockedAt: existingLock.lockedAt,
        });
      }
    }

    // Create new lock (use findOneAndUpdate with upsert to handle race conditions)
    const lock = await RecordLock.findOneAndUpdate(
      { recordId: id },
      {
        recordId: id,
        lockedBy: userInfo,
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // Log the lock action
    await logLockAction(id, "LOCK", userInfo, userInfo);

    // Send notification
    try {
      if (userInfo.userRole === "admin") {
        // Find and notify the counselor who created the record
        let counselorUser = null;
        
        // Try to find counselor by userId from auditTrail
        if (record.auditTrail?.createdBy?.userId) {
          counselorUser = await User.findById(record.auditTrail.createdBy.userId);
        }
        
        // If not found by userId, try to find by counselor name
        if (!counselorUser && record.counselor) {
          counselorUser = await User.findOne({ 
            $or: [
              { name: record.counselor },
              { email: record.counselor }
            ],
            role: "counselor"
          });
        }
        
        // Send notification to the counselor if found
        if (counselorUser) {
          await createCounselorNotification({
            counselorId: counselorUser._id,
            counselorEmail: counselorUser.email,
            title: "Record Locked by Admin",
            description: `Your record for client "${record.clientName} - Session ${record.sessionNumber}" has been locked by Admin ${userInfo.userName}. Editing is temporarily restricted until the lock is released.`,
            category: "System Alert",
            priority: "high",
            metadata: {
              recordId: record._id.toString(),
              clientName: record.clientName,
              sessionNumber: record.sessionNumber,
              lockedBy: userInfo.userName,
              lockedByRole: "admin",
              action: "LOCK",
            },
            relatedId: record._id,
            relatedType: "record",
          });
        }
        
        // Also notify all admins (existing behavior)
        const admins = await Admin.find({});
        for (const admin of admins) {
          await createNotification({
            title: "Record Locked",
            description: `Admin ${userInfo.userName} has locked record "${record.clientName} - Session ${record.sessionNumber}".`,
            category: "User Activity",
            priority: "low",
            metadata: {
              recordId: record._id.toString(),
              clientName: record.clientName,
              sessionNumber: record.sessionNumber,
              lockedBy: userInfo.userName,
            },
            relatedId: record._id,
            relatedType: "record",
          });
        }
      } else {
        // Counselor locked their own record - notify admins
        const admins = await Admin.find({});
        for (const admin of admins) {
          await createNotification({
            title: "Record Locked",
            description: `Record "${record.clientName} - Session ${record.sessionNumber}" has been locked by Counselor ${userInfo.userName}.`,
            category: "User Activity",
            priority: "low",
            metadata: {
              recordId: record._id.toString(),
              clientName: record.clientName,
              sessionNumber: record.sessionNumber,
              lockedBy: userInfo.userName,
            },
            relatedId: record._id,
            relatedType: "record",
          });
        }
      }
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
      // Don't fail the lock operation if notification fails
    }

    return res.status(200).json({
      success: true,
      message: "Record locked successfully.",
      lock: {
        recordId: lock.recordId,
        lockedBy: lock.lockedBy,
        lockedAt: lock.lockedAt,
        expiresAt: lock.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error locking record:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to lock record.",
      error: error.message,
    });
  }
};

/**
 * Unlock a record (only by lock owner)
 * POST /api/admin/records/:id/unlock
 * POST /api/records/:id/unlock
 */
export const unlockRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userInfo = getUserInfo(req);

    // Find the record
    const record = await Record.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }

    // Find the lock
    const lock = await RecordLock.findOne({
      recordId: id,
      isActive: true,
    });

    if (!lock) {
      return res.status(200).json({
        success: true,
        message: "Record is not currently locked.",
        locked: false,
      });
    }

    // Check if user is the lock owner
    const isLockOwner = lock.lockedBy.userId.toString() === userInfo.userId.toString();
    if (!isLockOwner) {
      await logLockAction(
        id,
        "UNLOCK",
        userInfo,
        lock.lockedBy,
        `Attempted to unlock record locked by ${lock.lockedBy.userName}.`
      );
      return res.status(403).json({
        success: false,
        message: `You cannot unlock this record. It is locked by ${lock.lockedBy.userName}.`,
      });
    }

    // Delete the lock document (cleaner than just marking inactive)
    await RecordLock.deleteOne({ _id: lock._id });

    // Log the unlock action
    await logLockAction(id, "UNLOCK", userInfo, lock.lockedBy);

    // Send notification
    try {
      if (userInfo.userRole === "admin") {
        // Find and notify the counselor who created the record
        let counselorUser = null;
        
        // Try to find counselor by userId from auditTrail
        if (record.auditTrail?.createdBy?.userId) {
          counselorUser = await User.findById(record.auditTrail.createdBy.userId);
        }
        
        // If not found by userId, try to find by counselor name
        if (!counselorUser && record.counselor) {
          counselorUser = await User.findOne({ 
            $or: [
              { name: record.counselor },
              { email: record.counselor }
            ],
            role: "counselor"
          });
        }
        
        // Send notification to the counselor if found
        if (counselorUser) {
          await createCounselorNotification({
            counselorId: counselorUser._id,
            counselorEmail: counselorUser.email,
            title: "Record Unlocked by Admin",
            description: `Your record for client "${record.clientName} - Session ${record.sessionNumber}" has been unlocked by Admin ${userInfo.userName}. You can now edit the record.`,
            category: "System Alert",
            priority: "medium",
            metadata: {
              recordId: record._id.toString(),
              clientName: record.clientName,
              sessionNumber: record.sessionNumber,
              unlockedBy: userInfo.userName,
              unlockedByRole: "admin",
              action: "UNLOCK",
            },
            relatedId: record._id,
            relatedType: "record",
          });
        }
        
        // Also notify all admins (existing behavior)
        const admins = await Admin.find({});
        for (const admin of admins) {
          await createNotification({
            title: "Record Unlocked",
            description: `Admin ${userInfo.userName} has unlocked record "${record.clientName} - Session ${record.sessionNumber}".`,
            category: "User Activity",
            priority: "low",
            metadata: {
              recordId: record._id.toString(),
              clientName: record.clientName,
              sessionNumber: record.sessionNumber,
              unlockedBy: userInfo.userName,
            },
            relatedId: record._id,
            relatedType: "record",
          });
        }
      } else {
        // Counselor unlocked their own record - notify admins
        const admins = await Admin.find({});
        for (const admin of admins) {
          await createNotification({
            title: "Record Unlocked",
            description: `Record "${record.clientName} - Session ${record.sessionNumber}" has been unlocked by Counselor ${userInfo.userName}.`,
            category: "User Activity",
            priority: "low",
            metadata: {
              recordId: record._id.toString(),
              clientName: record.clientName,
              sessionNumber: record.sessionNumber,
              unlockedBy: userInfo.userName,
            },
            relatedId: record._id,
            relatedType: "record",
          });
        }
      }
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
      // Don't fail the unlock operation if notification fails
    }

    return res.status(200).json({
      success: true,
      message: "Record unlocked successfully.",
      locked: false,
    });
  } catch (error) {
    console.error("Error unlocking record:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unlock record.",
      error: error.message,
    });
  }
};

/**
 * Get lock status for a record
 * GET /api/admin/records/:id/lock-status
 * GET /api/records/:id/lock-status
 */
export const getLockStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userInfo = getUserInfo(req);

    // Clean up expired locks first
    await cleanupExpiredLocks();

    // Find the record
    const record = await Record.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }

    // Find active lock
    const lock = await RecordLock.findOne({
      recordId: id,
      isActive: true,
    });

    if (!lock || lock.isExpired()) {
      return res.status(200).json({
        success: true,
        locked: false,
        canLock: true,
        canUnlock: false,
      });
    }

    // Check if current user is the lock owner
    const isLockOwner = lock.lockedBy.userId.toString() === userInfo.userId.toString();

    return res.status(200).json({
      success: true,
      locked: true,
      lockedBy: {
        userId: lock.lockedBy.userId,
        userName: lock.lockedBy.userName,
        userRole: lock.lockedBy.userRole,
      },
      lockedAt: lock.lockedAt,
      expiresAt: lock.expiresAt,
      canLock: false,
      canUnlock: isLockOwner,
      isLockOwner,
    });
  } catch (error) {
    console.error("Error getting lock status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get lock status.",
      error: error.message,
    });
  }
};

/**
 * Get lock audit logs for a record
 * GET /api/admin/records/:id/lock-logs
 * GET /api/records/:id/lock-logs
 */
export const getLockLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    // Verify record exists
    const record = await Record.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found.",
      });
    }

    // Get lock logs
    const logs = await LockAuditLog.find({ recordId: id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      logs: logs.map((log) => ({
        action: log.action,
        performedBy: log.performedBy,
        lockOwner: log.lockOwner,
        reason: log.reason,
        timestamp: log.createdAt,
        metadata: log.metadata,
      })),
    });
  } catch (error) {
    console.error("Error getting lock logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get lock logs.",
      error: error.message,
    });
  }
};

/**
 * Middleware to check if record is locked before allowing updates
 * Returns 423 if locked by another user
 */
export const checkLockBeforeUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userInfo = getUserInfo(req);

    // Clean up expired locks
    await cleanupExpiredLocks();

    // Find active lock
    const lock = await RecordLock.findOne({
      recordId: id,
      isActive: true,
    });

    if (!lock || lock.isExpired()) {
      // No lock or expired - allow update
      return next();
    }

    // Check if current user is the lock owner
    const isLockOwner = lock.lockedBy.userId.toString() === userInfo.userId.toString();

    if (!isLockOwner) {
      // Log blocked edit attempt
      await logLockAction(
        id,
        "EDIT_ATTEMPT_BLOCKED",
        userInfo,
        lock.lockedBy,
        `Edit attempt blocked - record locked by ${lock.lockedBy.userName}.`
      );

      return res.status(423).json({
        success: false,
        message: `Record is locked by ${lock.lockedBy.userName}. Editing is not allowed.`,
        lockedBy: {
          userId: lock.lockedBy.userId,
          userName: lock.lockedBy.userName,
          userRole: lock.lockedBy.userRole,
        },
        lockedAt: lock.lockedAt,
      });
    }

    // User owns the lock - allow update
    next();
  } catch (error) {
    console.error("Error checking lock:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify record lock status.",
      error: error.message,
    });
  }
};

