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
  sentOtp,
  updateUserProfile,
  verifyOtp,
} from "../controllers/user/auth/user.controller.js";
import passport from "passport";
import {
  verifyJwt,
  verifyJwtAdmin,
  verifyJwtSuperAdmin,
} from "../middlewares/auth.middleware.js";
import { superAdminLogin } from "../controllers/super-admin/auth/superadmin.controller.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import {
  getInvitedOrganizers,
  inviteOrganizer,
  reInviteOrganizer,
} from "../controllers/super-admin/invite-organizer.controller.js";
import { adminCreatePassword } from "../controllers/admin/auth/create-password.controller.js";
import {
  loginAdmin,
  sentOtpAdmin,
  verifyOtpAdmin,
} from "../controllers/admin/auth/login.controller.js";
import {
  createEventCategory,
  getCategories,
} from "../controllers/super-admin/create-category.controller.js";
import {
  createEvent,
  getEvents,
} from "../controllers/admin/events/event.controller.js";
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
  .post(verifyJwtSuperAdmin, checkRole("super-admin"), logoutUser);

router
  .route("/super-admin/invite/admin")
  .post(verifyJwtSuperAdmin, checkRole("super-admin"), inviteOrganizer);

router.route("/admin/set-password").post(adminCreatePassword);

router.route("/admin/login").post(loginAdmin);

router
  .route("/admin/logout")
  .post(verifyJwtAdmin, checkRole("organizer"), logoutUser);

router.route("/forgot-password").post(sentOtp);
router.route("/forgot-password/create-password").post(verifyOtp);
router
  .route("/organizers")
  .get(verifyJwtSuperAdmin, checkRole("super-admin"), getInvitedOrganizers);

router
  .route("/super-admin/re-invite/:id")
  .post(verifyJwtSuperAdmin, checkRole("super-admin"), reInviteOrganizer);

router.route("/admin/forgot-password").post(sentOtpAdmin);
router.route("/admin/forgot-password/create-password").post(verifyOtpAdmin);

router
  .route("/super-admin/event/create-category")
  .post(verifyJwtSuperAdmin, checkRole("super-admin"), createEventCategory);

router
  .route("/super-admin/event/categories")
  .get(verifyJwtSuperAdmin, checkRole("super-admin"), getCategories);

router
  .route("/admin/event")
  .post(
    verifyJwtAdmin,
    checkRole("organizer"),
    upload.single("event_pic"),
    createEvent
  );

router
  .route("/admin/event")
  .get(verifyJwtAdmin, checkRole("organizer"), getEvents);
export default router;
