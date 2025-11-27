import mongoose from "mongoose";

const recordLockSchema = new mongoose.Schema(
  {
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Record",
      required: true,
      unique: true,
      index: true,
    },
    lockedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      userName: {
        type: String,
        required: true,
      },
      userRole: {
        type: String,
        enum: ["admin", "counselor"],
        required: true,
      },
      userEmail: {
        type: String,
        required: true,
      },
    },
    lockedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      // Lock expires after 24 hours if not manually unlocked
      default: function () {
        const expires = new Date();
        expires.setHours(expires.getHours() + 24);
        return expires;
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
recordLockSchema.index({ recordId: 1, isActive: 1 });
recordLockSchema.index({ "lockedBy.userId": 1, isActive: 1 });
recordLockSchema.index({ expiresAt: 1 });

// Method to check if lock is expired
recordLockSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

// Method to check if lock is valid (active and not expired)
recordLockSchema.methods.isValid = function () {
  return this.isActive && !this.isExpired();
};

const RecordLock =
  mongoose.models.RecordLock || mongoose.model("RecordLock", recordLockSchema);

export default RecordLock;

