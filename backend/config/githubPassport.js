import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import dotenv from "dotenv";
import GitHubUser from "../models/GitHubUser.js"; // corrected import

dotenv.config();

console.log("✅ GitHub Strategy Config:");
console.log("   Client ID:", process.env.GITHUB_CLIENT_ID);
console.log("   Callback URL:", `${process.env.SERVER_URL}/auth/github/callback`);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/auth/github/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Log profile for debugging
        console.log("🔐 GitHub profile:", profile.username);

        let user = await GitHubUser.findOne({ githubId: profile.id });

        if (!user) {
          user = await GitHubUser.create({
            githubId: profile.id,
            username: profile.username,
            email: profile.emails?.[0]?.value || "",
            avatar: profile.photos?.[0]?.value || "",
          });
        }

        return done(null, user);
      } catch (err) {
        console.error("❌ Error creating/finding GitHub user:", err);
        return done(err, null);
      }
    }
  )
);

// Session management
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await GitHubUser.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
