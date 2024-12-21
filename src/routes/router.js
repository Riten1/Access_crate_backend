import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getCurrentUser,
  getUsers,
  loginUser,
  logoutUser,
  registerUser,
  updateUserProfile,
} from "../controllers/user.controller.js";
import passport from "passport";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/auth/register").post(
  upload.fields([
    {
      name: "profile_pic",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/auth/login").post(loginUser);
router
  .route("/auth/google")
  .get(passport.authenticate("google", { scope: ["profile", "email"] }));

router
  .route("/auth/google/callback")
  .get(
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
      // After successful login, redirect to homepage or another page
      res.redirect("http://localhost:5173/"); // Example: homepage on your frontend
    }
  );

router.route("/get-users").get(getUsers);

router.route("/auth/logout").post(verifyJwt, logoutUser);

router.route("/profile").get(verifyJwt, getCurrentUser);

router.route("/update-profile").post(verifyJwt, upload.single("profile_pic"), updateUserProfile);
export default router;
