const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema");
const env = require("dotenv").config();
const handleUserBonus = require("../service/welcomeBonus");
const crypto = require('crypto');


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://timecrafters.arshadrahim.tech/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        } else {
          function generateCode(length = 8) {
            const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let code = "";

            const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
            code += timestamp;

            const remainingLength = length - timestamp.length;
            for (let i = 0; i < remainingLength; i++) {
              const randomIndex = crypto.randomInt(0, characters.length);
              code += characters[randomIndex];
            }

            return code;
          }
          const referalCode = generateCode();

          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            referalCode: referalCode,
          });
          await user.save();

          await handleUserBonus(user._id, "welcome");
          return done(null, user);
        }
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

module.exports = passport;
