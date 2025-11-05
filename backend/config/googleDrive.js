import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

// --- Initialize OAuth2 client ---
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI // Make sure this matches one in your Google Cloud Console
);

// If you already have a refresh token, you can set it here
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// --- Initialize Google Drive API client ---
const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

export default drive;
