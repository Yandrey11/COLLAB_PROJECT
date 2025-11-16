import mongoose from "mongoose";

const sessionSettingsSchema = new mongoose.Schema(
  {
    inactivityTimeout: {
      type: Number, // in minutes
      default: 30,
      min: 5,
      max: 1440, // 24 hours max
    },
    maxSessionDuration: {
      type: Number, // in minutes
      default: 480, // 8 hours
      min: 15,
      max: 2880, // 48 hours max
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Only one settings document should exist
sessionSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const SessionSettings =
  mongoose.models.SessionSettings || mongoose.model("SessionSettings", sessionSettingsSchema);

export default SessionSettings;

