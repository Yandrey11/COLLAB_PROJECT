// config/adminGithubPassport.js
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import Admin from "../models/Admin.js"; // Make sure you have Admin model

passport.use(
  "admin-github",
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/auth/admin/github/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let admin = await Admin.findOne({ githubId: profile.id });

        if (!admin) {
          admin = await Admin.create({
            name: profile.displayName || profile.username,
            email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
            githubId: profile.id,
            avatar: profile.photos?.[0]?.value || null,
            role: "admin",
          });
        }

        return done(null, admin);
      } catch (error) {
        console.error("GitHub Admin Auth Error:", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((admin, done) => {
  done(null, admin.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const admin = await Admin.findById(id);
    done(null, admin);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
