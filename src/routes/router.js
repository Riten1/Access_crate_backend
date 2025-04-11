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
  getCloserUpcomingEvents,
  getEvent,
  getEvents,
  getFeaturedEvents,
} from "../controllers/admin/events/event.controller.js";
import {
  createTicket,
  deleteTicket,
  getTicket,
  getTickets,
  updateTicket,
} from "../controllers/admin/events/ticket.controller.js";
import {
  getAdminProfile,
  updateAdminProfile,
} from "../controllers/admin/admin-profile.controller.js";
import {
  getOrganizer,
  getOrganizerEvents,
  getTopTwoOrganizers,
  getUserOrganizers,
  remainingThreeTopOrganizers,
} from "../controllers/user/organizers/organizers.controller.js";
import { getUserEvents } from "../controllers/user/events/user-events.controller.js";
import {
  getPaymentHistory,
  // getPaymentHistory,
  initiateEsewaPayment,
  // initiatePayment,
  verifyEsewaPayment,
  // verifyPayment,
} from "../controllers/user/payment/payment.controller.js";
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

router.route("/event/categories").get(getCategories);

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
router.route("/event").get(getFeaturedEvents);
router.route("/event/:id").get(getEvent);

router
  .route("/admin/event/categories")
  .get(verifyJwtAdmin, checkRole("organizer"), getCategories);

router
  .route("/admin/event/:eventId/ticket")
  .post(verifyJwtAdmin, checkRole("organizer"), createTicket);

router
  .route("/admin/event/:eventId/ticket")
  .get(verifyJwtAdmin, checkRole("organizer"), getTickets);
router
  .route("/admin/event/:eventId/ticket/:ticketId")
  .patch(verifyJwtAdmin, checkRole("organizer"), updateTicket);
router
  .route("/admin/event/:eventId/ticket/:ticketId")
  .get(verifyJwtAdmin, checkRole("organizer"), getTicket);
router
  .route("/admin/event/:eventId/ticket/:ticketId")
  .delete(verifyJwtAdmin, checkRole("organizer"), deleteTicket);

router.route("/upcomming-events").get(getCloserUpcomingEvents);

router
  .route("/admin/profile")
  .get(verifyJwtAdmin, checkRole("organizer"), getAdminProfile);
router
  .route("/admin/profile")
  .patch(
    verifyJwtAdmin,
    checkRole("organizer"),
    upload.single("profile_pic"),
    updateAdminProfile
  );

router.route("/top-two-organizers").get(getTopTwoOrganizers);
router.route("/remaining-three-organizers").get(remainingThreeTopOrganizers);
router.route("/organizer/:id").get(getOrganizer);
router.route("/organizer-events/:id").get(getOrganizerEvents);

router.route("/events").get(getUserEvents);
router.route("/user-organizers").get(getUserOrganizers);

router
  .route("/admin/:id/event", verifyJwtAdmin, checkRole("organizer"))
  .get(getOrganizerEvents);

// router.post("/payment/initiate", verifyJwt, checkRole("user"), initiatePayment);
// router.post("/payment/verify", verifyJwt, checkRole("user"), verifyPayment);
router.get("/payment/history", verifyJwt, checkRole("user"), getPaymentHistory);
router.post(
  "/esewa/initiate",
  verifyJwt,
  checkRole("user"),
  initiateEsewaPayment
);
// Handle both POST (frontend) and GET (eSewa callback)
// Handle both verification methods
router
  .route("/esewa/verify", verifyJwt, checkRole("user"))
  .get(verifyEsewaPayment) // For eSewa direct callbacks
  .post(verifyEsewaPayment); // For internal API calls // For eSewa direct callbacks// router.route("/event/categories").get(getCategories);
export default router;
