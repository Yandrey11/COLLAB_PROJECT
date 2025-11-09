import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true },
    date: { type: Date, default: Date.now },
    sessionType: { type: String, required: true },
    status: {
      type: String,
      enum: ["Ongoing", "Completed", "Referred"],
      default: "Ongoing",
    },
    notes: { type: String },
    outcomes: { type: String },
    driveLink: { type: String },
    counselor: { type: String, required: true },
  },
  { timestamps: true }
);

// ✅ Prevent OverwriteModelError when models are imported multiple times
const Record = mongoose.models.Record || mongoose.model("Record", recordSchema);

export default Record;
