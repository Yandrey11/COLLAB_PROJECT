// app.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import connectDB from "./config/db.js";

// ✅ Load environment variables
dotenv.config();

// ✅ Connect to MongoDB
connectDB();

// ✅ Initialize Express
const app = express();

// ✅ Import Google Passport configurations
// (MUST come after dotenv.config and before routes)
import "./config/passport.js";        // User Google OAuth
import "./config/adminPassport.js";   // Admin Google OAuth

// ✅ Import routes
import authRoutes from "./routes/authRoutes.js";                  
import googleAuthRoutes from "./routes/googleAuthRoutes.js";      
import resetRoutes from "./routes/resetRoutes.js";                
import adminRoutes from "./routes/adminRoutes.js";                
import adminGoogleAuthRoutes from "./routes/adminGoogleAuthRoutes.js"; 
import adminRefreshRoutes from "./routes/adminRefreshRoutes.js";  

// ✅ CORS setup
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session configuration (required for Google OAuth)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // ⚠️ Set to true if using HTTPS in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
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

// ✅ API routes
app.use("/api/auth", authRoutes);             
app.use("/auth", googleAuthRoutes);           
app.use("/auth/admin", adminGoogleAuthRoutes);
app.use("/api/reset", resetRoutes);           
app.use("/api/admin", adminRoutes);           
app.use("/api/admin", adminRefreshRoutes);    

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
