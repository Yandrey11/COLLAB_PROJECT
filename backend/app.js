// app.js


import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import cookieParser from "cookie-parser"; // ✅ Keep only ONE
import connectDB from "./config/db.js";
// ✅ Load environment variables
dotenv.config();

// ✅ Connect to MongoDB
connectDB();

// ✅ Initialize Express
const app = express();

// ✅ Passport configurations (must come before routes)
import "./config/passport.js";              // user auth (Google/local)
import "./config/adminPassport.js";         // admin Google/local auth
import "./config/adminGithubPassport.js";   // ✅ new GitHub admin auth

// ✅ Core middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Session configuration (for OAuths)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set true if using https
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// ✅ Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("✅ Backend server is running...");
});

// ✅ Import routes
import authRoutes from "./routes/authRoutes.js";
import googleAuthRoutes from "./routes/googleAuthRoutes.js";
import resetRoutes from "./routes/resetRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import adminGoogleAuthRoutes from "./routes/admin/adminGoogleAuthRoutes.js";
import adminRefreshRoutes from "./routes/admin/adminRefreshRoutes.js";
import adminSignupRoutes from "./routes/admin/adminSignupRoutes.js";
import adminLoginRoutes from "./routes/admin/adminLoginRoutes.js";
import configRoutes from "./routes/configRoutes.js";
import githubAuthRoutes from "./routes/githubAuthRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";
import googleDriveRoutes from "./routes/googleDriveRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminGitHubAuthRoutes from "./routes/admin/adminGitHubAuthRoutes.js";
import adminTokenRoutes from "./routes/admin/adminTokenRoutes.js";
app.use("/api/admin", adminTokenRoutes);

// ✅ Register routes AFTER middleware
app.use("/api/auth", authRoutes);
app.use("/auth", googleAuthRoutes);
app.use("/auth/admin", adminGoogleAuthRoutes);

app.use("/api/reset", resetRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminRefreshRoutes);
app.use("/api/admin", adminSignupRoutes);
app.use("/auth/admin", adminGoogleAuthRoutes);
app.use("/auth/admin", adminGitHubAuthRoutes);
app.use("/api/reset", resetRoutes);
app.use("/api/records", recordRoutes);
app.use("/auth", googleDriveRoutes);

// ✅ Reports route (must come after express.json())
app.use("/api/reports", reportRoutes);

// ✅ Error handling
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
