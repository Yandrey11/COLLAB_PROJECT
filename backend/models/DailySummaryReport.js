import mongoose from "mongoose";

const dailySummaryReportSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      index: true,
    },
    day: {
      type: Number,
      required: true,
      index: true,
    },
    week: {
      type: Number,
      required: true,
      index: true,
    },
    // Record statistics
    recordsCreated: {
      type: Number,
      default: 0,
    },
    recordsUpdated: {
      type: Number,
      default: 0,
    },
    recordsDeleted: {
      type: Number,
      default: 0,
    },
    recordsLocked: {
      type: Number,
      default: 0,
    },
    recordsUnlocked: {
      type: Number,
      default: 0,
    },
    totalRecords: {
      type: Number,
      default: 0,
    },
    // PDF statistics
    pdfsGenerated: {
      type: Number,
      default: 0,
    },
    pdfsDownloaded: {
      type: Number,
      default: 0,
    },
    // Google Drive statistics
    driveUploads: {
      type: Number,
      default: 0,
    },
    driveConnections: {
      type: Number,
      default: 0,
    },
    // User statistics
    activeUsers: {
      type: Number,
      default: 0,
    },
    activeCounselors: {
      type: Number,
      default: 0,
    },
    activeAdmins: {
      type: Number,
      default: 0,
    },
    logins: {
      type: Number,
      default: 0,
    },
    logouts: {
      type: Number,
      default: 0,
    },
    // Page visit statistics
    pageVisits: {
      type: Map,
      of: Number,
      default: {},
    },
    totalPageVisits: {
      type: Number,
      default: 0,
    },
    // Report statistics
    reportsGenerated: {
      type: Number,
      default: 0,
    },
    reportsViewed: {
      type: Number,
      default: 0,
    },
    // System statistics
    backupsCreated: {
      type: Number,
      default: 0,
    },
    notificationsSent: {
      type: Number,
      default: 0,
    },
    // Record status distribution
    recordStatusDistribution: {
      Ongoing: {
        type: Number,
        default: 0,
      },
      Completed: {
        type: Number,
        default: 0,
      },
      Referred: {
        type: Number,
        default: 0,
      },
    },
    // Unique users who performed actions
    uniqueUsers: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    uniqueCounselors: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
dailySummaryReportSchema.index({ date: -1 });
dailySummaryReportSchema.index({ year: 1, month: 1, day: 1 });
dailySummaryReportSchema.index({ year: 1, week: 1 });
dailySummaryReportSchema.index({ createdAt: -1 });

const DailySummaryReport =
  mongoose.models.DailySummaryReport || mongoose.model("DailySummaryReport", dailySummaryReportSchema);

export default DailySummaryReport;

