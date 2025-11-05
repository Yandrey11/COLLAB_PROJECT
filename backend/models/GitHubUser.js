import mongoose from "mongoose";

const GitHubUserSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },
  username: String,
  email: String,
  avatar: String,
});

const GitHubUser = mongoose.model("GitHubUser", GitHubUserSchema);
export default GitHubUser;
