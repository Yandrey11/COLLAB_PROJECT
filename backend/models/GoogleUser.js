import mongoose from "mongoose";

const googleUserSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    name: String,
    email: { type: String, unique: true },
    role: {
      type: String,
      enum: ["counselor", "admin"],
      default: "counselor",
    },
  },
  { timestamps: true }
);

export default mongoose.model("GoogleUser", googleUserSchema);
