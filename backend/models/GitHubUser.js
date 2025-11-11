import mongoose from "mongoose";

const GitHubUserSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: String,
  avatar: String
});

export default mongoose.model("GitHubUser", GitHubUserSchema);
