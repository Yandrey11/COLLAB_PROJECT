import mongoose from "mongoose";

const adminLocalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "admin_local_accounts", // Optional: helps keep DB organized
  }
);

export default mongoose.model("AdminLocal", adminLocalSchema);
