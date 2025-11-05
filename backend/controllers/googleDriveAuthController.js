import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI
);

// ✅ Store tokens in memory for now
let driveTokens = null;

// --- Step 1: Redirect user to Google OAuth consent screen ---
export const googleDriveAuth = async (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/drive.file"];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
  res.redirect(authUrl);
};

// --- Step 2: Handle OAuth callback ---
export const googleDriveCallback = async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    driveTokens = tokens; // ✅ Save the tokens in memory
    console.log("✅ Google Drive connected successfully!");

    res.send("✅ Google Drive connected successfully. You can now upload files.");
  } catch (err) {
    console.error("❌ Error during Google OAuth callback:", err);
    res.status(500).json({ message: "Google Drive OAuth failed", error: err.message });
  }
};

// --- Step 3: Helper to access the Drive client safely ---
export const getDriveClient = () => {
  if (!driveTokens) throw new Error("Google Drive not connected — no tokens saved");
  oauth2Client.setCredentials(driveTokens);
  return google.drive({ version: "v3", auth: oauth2Client });
};
