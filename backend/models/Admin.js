import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin" },
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },
    // Profile fields
    profilePicture: { type: String, default: null },
    phoneNumber: { type: String },
    bio: { type: String, maxLength: 500 },
    // Settings fields
    settings: {
      display: {
        theme: { type: String, enum: ["light", "dark"], default: "light" },
        uiDensity: { type: String, enum: ["compact", "normal"], default: "normal" },
        defaultDashboardView: { type: String, enum: ["users", "records", "notifications", "analytics"], default: "records" },
      },
      notifications: {
        newUserCreations: { type: Boolean, default: true },
        recordUpdates: { type: Boolean, default: true },
        criticalSystemAlerts: { type: Boolean, default: true },
        pdfGenerations: { type: Boolean, default: true },
        loginAttempts: { type: Boolean, default: false },
        soundEnabled: { type: Boolean, default: false },
      },
      privacy: {
        hideProfilePhoto: { type: Boolean, default: false },
        maskNameInNotifications: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

// ✅ Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare passwords
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
