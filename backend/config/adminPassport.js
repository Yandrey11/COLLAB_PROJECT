import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";

dotenv.config();

passport.use(
  "admin-google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_ADMIN_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("Google account has no email"), null);

        let admin = await Admin.findOne({ email });

        if (!admin) {
          console.log(`🚫 Unauthorized Google login attempt: ${email}`);
          return done(null, false);
        }

        admin.googleId = profile.id;
        await admin.save();
        done(null, admin);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((admin, done) => done(null, admin.id));
passport.deserializeUser(async (id, done) => {
  const admin = await Admin.findById(id);
  done(null, admin);
});

export default passport;
