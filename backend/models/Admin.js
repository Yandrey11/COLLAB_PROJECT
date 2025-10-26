// models/Admin.js
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, default: null },
  password: { type: String, default: null },
  role: { type: String, default: "admin" }, // ✅ Ensure this field exists
});

export default mongoose.model("Admin", adminSchema);
