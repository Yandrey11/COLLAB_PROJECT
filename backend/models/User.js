import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["counselor", "admin"],
      default: "counselor",
    },
    accountStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    googleId: { type: String },
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// ✅ Hash password ONLY if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  console.log("🔒 Hashing password for:", this.email);
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
