import mongoose from "mongoose";

const googleUserSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    name: String,
    email: { type: String, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model("GoogleUser", googleUserSchema);
