import Record from "../../models/Record.js";
import { createNotification } from "./notificationController.js";

// Helper to get user info from request
const getUserInfo = (req) => {
  return {
    userId: req.admin?._id || req.user?._id,
    userName: req.admin?.name || req.user?.name || req.admin?.email || req.user?.email || "System",
    userRole: req.admin?.role || req.user?.role || "admin",
  };
};

// 📋 Get all records with search, filter, and pagination
export const getAllRecords = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search = "",
      sessionType = "",
      status = "",
      counselor = "",
      startDate = "",
      endDate = "",
      sortBy = "date",
      order = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};

    // Search filter (client name or counselor)
    if (search) {
      filter.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { counselor: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status && status !== "all") {
      filter.status = status;
    }

    // Session type filter
    if (sessionType && sessionType !== "all") {
      filter.sessionType = sessionType;
    }

    // Counselor filter
    if (counselor && counselor !== "all") {
      filter.counselor = counselor;
    }

    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Sort options
    const sortOption = {};
    sortOption[sortBy] = order === "desc" ? -1 : 1;

    // Get records with pagination
    const records = await Record.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await Record.countDocuments(filter);

    // Get unique counselors for filter dropdown
    const counselors = await Record.distinct("counselor");

    res.status(200).json({
      records,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        limit: parseInt(limit),
      },
      filters: {
        counselors,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching records:", error);
    res.status(500).json({ message: "Failed to fetch records", error: error.message });
  };
};

// 👁️ Get single record by ID
export const getRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Record.findById(id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json(record);
  } catch (error) {
    console.error("❌ Error fetching record:", error);
    res.status(500).json({ message: "Failed to fetch record", error: error.message });
  }
};

// ✏️ Update record
export const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userInfo = getUserInfo(req);

    const record = await Record.findById(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Track changes for audit trail
    const changes = [];
    const updateData = { ...req.body };

    // Compare old and new values
    Object.keys(updateData).forEach((key) => {
      if (key !== "auditTrail" && key !== "attachments" && record[key] !== updateData[key]) {
        changes.push({
          field: key,
          oldValue: record[key],
          newValue: updateData[key],
          changedBy: userInfo,
          changedAt: new Date(),
        });
      }
    });

    // Update record
    Object.assign(record, updateData);

    // Update audit trail
    record.auditTrail.lastModifiedBy = userInfo;
    record.auditTrail.lastModifiedAt = new Date();
    if (changes.length > 0) {
      record.auditTrail.modificationHistory.push(...changes);
    }

    await record.save();

    // Create notification
    try {
      await createNotification({
        title: "Record Updated",
        description: `${userInfo.userName} (${userInfo.userRole}) updated record for client: ${record.clientName} - Session ${record.sessionNumber}`,
        category: "User Activity",
        priority: "medium",
        metadata: {
          clientName: record.clientName,
          recordId: record._id.toString(),
          updatedBy: userInfo.userName,
          updatedByRole: userInfo.userRole,
          changes: changes.map((c) => c.field),
        },
        relatedId: record._id,
        relatedType: "record",
      });
    } catch (notificationError) {
      console.error("⚠️ Notification creation failed (non-critical):", notificationError);
    }

    res.status(200).json({
      message: "Record updated successfully",
      record,
    });
  } catch (error) {
    console.error("❌ Error updating record:", error);
    res.status(500).json({ message: "Failed to update record", error: error.message });
  }
};

// 🗑️ Delete record
export const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const userInfo = getUserInfo(req);

    const record = await Record.findById(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Update audit trail before deletion
    record.auditTrail.deletedBy = userInfo;
    record.auditTrail.deletedAt = new Date();
    await record.save();

    // Delete record
    await Record.findByIdAndDelete(id);

    // Create notification
    try {
      await createNotification({
        title: "Record Deleted",
        description: `${userInfo.userName} (${userInfo.userRole}) deleted record for client: ${record.clientName} - Session ${record.sessionNumber}`,
        category: "User Activity",
        priority: "high",
        metadata: {
          clientName: record.clientName,
          recordId: id,
          deletedBy: userInfo.userName,
          deletedByRole: userInfo.userRole,
        },
        relatedType: "record",
      });
    } catch (notificationError) {
      console.error("⚠️ Notification creation failed (non-critical):", notificationError);
    }

    res.status(200).json({
      message: "Record deleted successfully",
      recordId: id,
    });
  } catch (error) {
    console.error("❌ Error deleting record:", error);
    res.status(500).json({ message: "Failed to delete record", error: error.message });
  }
};

