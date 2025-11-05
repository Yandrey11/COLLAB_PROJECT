import fs from "fs";
import path from "path";

const TOKEN_PATH = path.resolve("config/google-tokens.json");

// Save tokens
export const saveTokens = (tokens) => {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log("✅ Google tokens saved!");
};

// Load tokens
export const loadTokens = () => {
  if (fs.existsSync(TOKEN_PATH)) {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
  }
  console.warn("⚠️ No Google tokens found, please connect Drive first!");
  return null;
};
