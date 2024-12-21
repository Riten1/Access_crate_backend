import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
// import session from "express-session";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "./models/user.model.js";

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//   })
// );

// // Initialize Passport
// app.use(passport.initialize());
// app.use(passport.session());

// // Serialize and Deserialize User
// passport.serializeUser((user, done) => done(null, user));
// passport.deserializeUser((user, done) => done(null, user));

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: process.env.GOOGLE_CALLBACK_URL,
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         // Replace this with your database interaction
//         const existingUser = await User.findOne({
//           email: profile.emails[0].value,
//         }).populate(profile.emails[0].value);

//         if (existingUser) {
//           // User exists, proceed to login
//           return done(null, existingUser);
//         } else {
//           // User doesn't exist, create a new user
//           const newUser = await User.create({
//             name: profile.displayName,
//             email: profile.emails[0].value,

//             profile_pic: profile.photos[0].value, // Save profile photo if needed
//           });
//           return done(null, newUser);
//         }
//       } catch (error) {
//         return done(error, null);
//       }
//     }
//   )
// );

import userRouter from "./routes/router.js";
app.use("/api/v1/user", userRouter);

export default app;
