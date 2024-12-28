import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUsers,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateUserProfile,
} from "../controllers/user/auth/user.controller.js";
import passport from "passport";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { superAdminLogin } from "../controllers/super-admin/auth/superadmin.controller.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { inviteOrganizer } from "../controllers/super-admin/invite-organizer.controller.js";
import { adminCreatePassword } from "../controllers/admin/auth/create-password.controller.js";
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

router.route("/get-users").get(checkRole("user"), getUsers);

router.route("/auth/logout").post(verifyJwt, checkRole("user"), logoutUser);

router.route("/profile").get(verifyJwt, checkRole("user"), getCurrentUser);

router
  .route("/update-profile")
  .patch(
    verifyJwt,
    checkRole("user"),
    upload.single("profile_pic"),
    updateUserProfile
  );

router
  .route("/change-password")
  .post(verifyJwt, checkRole("user"), changeCurrentPassword);

router.route("/refresh-token").post(verifyJwt, refreshAccessToken);

router.route("/auth/super-admin/login").post(superAdminLogin);

router
  .route("/auth/super-admin/logout")
  .post(verifyJwt, checkRole("super-admin"), logoutUser);

router
  .route("/super-admin/invite/admin")
  .post(verifyJwt, checkRole("super-admin"), inviteOrganizer);

router.route("/admin/set-password").post(adminCreatePassword);
export default router;
