import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import GitHubUser from "../models/GitHubUser.js";

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await GitHubUser.findOne({ githubId: profile.id });

        if (!user) {
          user = await GitHubUser.create({
            githubId: profile.id,
            username: profile.username,
            avatar: profile.photos?.[0]?.value
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await GitHubUser.findById(id);
  done(null, user);
});

export default passport;
