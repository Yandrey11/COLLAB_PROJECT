  import mongoose from "mongoose";

  const recordSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    date: { type: Date },
    sessionType: { type: String },
    status: { type: String, default: "Ongoing" },
    notes: { type: String },
    outcomes: { type: String },
    driveLink: { type: String },
    counselor: { type: String },
  }, { timestamps: true });

  export default mongoose.model("Record", recordSchema);
