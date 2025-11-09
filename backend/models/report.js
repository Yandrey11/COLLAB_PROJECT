// models/report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    totalSessions: Number,
    completedSessions: Number,
    ongoingSessions: Number,
    referredSessions: Number,
    summary: String,
    sessions: [
      {
        type: Object, // stores entire Record snapshot
      },
    ],
  },
  { timestamps: true }
);

const Report =
  mongoose.models.Report || mongoose.model("Report", reportSchema);

export default Report;
