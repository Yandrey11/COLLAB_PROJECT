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
    googleCalendarAccessToken: { type: String },
    googleCalendarRefreshToken: { type: String },
    googleCalendarTokenExpires: { type: Date },
    profilePicture: { type: String, default: null },
    phoneNumber: { type: String },
    bio: { type: String, maxLength: 500 },
  },
  { timestamps: true }
);

export default mongoose.model("GoogleUser", googleUserSchema);
