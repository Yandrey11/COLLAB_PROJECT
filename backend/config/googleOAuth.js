import { google } from "googleapis";
import { saveTokens, loadTokens } from "./googleTokenStore.js";

export const getOAuthClient = () => {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const savedTokens = loadTokens();
  if (savedTokens) client.setCredentials(savedTokens);
  return client;
};

export const storeTokens = (tokens) => {
  saveTokens(tokens);
};

export const getDriveInstance = () => {
  const auth = getOAuthClient();
  return google.drive({ version: "v3", auth });
};
