import Invitation from "../../models/invitation.model.js";
import User from "../../models/user.model.js";
import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import ApiResponse from "../../utils/ApiResponse.js";

export const inviteOrganizer = asyncHandler(async (req, res) => {
  const {
    organizerName,
    organizerEmail,
    ownerName,
    profile_pic,
    contact_info,
  } = req.body;

  if (!organizerName) {
    throw new ApiError(false, "Organizer Name is required", null, 400);
  }

  if (!organizerEmail) {
    throw new ApiError(false, "Organizer Email is required", null, 400);
  }

  if (!ownerName) {
    throw new ApiError(false, "Owner Name is required", null, 400);
  }

  const existingUser = await User.findOne({ email: organizerEmail });
  const existingInvitation = await Invitation.findOne({
    email: organizerEmail,
  });

  if (existingUser || existingInvitation) {
    throw new ApiError(
      false,
      "Organizer already invited or registered",
      null,
      400
    );
  }

  const invitationToken = crypto.randomBytes(32).toString("hex");
  const invitationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const invitedOrganizer = await Invitation.create({
    full_name: organizerName,
    email: organizerEmail,
    contact_info,
    role: "organizer",
    status: "pending",
    invitedBy: req.user._id,
    invitationToken,
    invitationExpiry,
  });

  const frontendNavigationUrl = `${process.env.INVITATION_FRONTEND_NAVIGATION_URL}/invite?token=${invitationToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.MY_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Access Crate" <${process.env.MY_EMAIL}>`,
    to: organizerEmail,
    subject: "You're invited to join Access Crate",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center;">You are Invited!</h2>
        
        <p style="margin-bottom: 20px;">Dear ${organizerName},</p>

        <p>We have invited you to join Access Crate as an Organizer.</p>
        <p>Click the link below to accept the invitation and create your account:</p>
         <a style="text-decoration: underline ; color: blue;" href="${frontendNavigationUrl}">${frontendNavigationUrl}</a>
        <p style="margin-top: 10px;">Note: If the link does not work, you can copy and paste the url link into your browser:</p>
       
        <p style="margin-top: 20px;">Best regards,<br/>Access Crate Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);

  return res
    .status(200)
    .json(new ApiResponse(true, "Invitation sent successfully", {}, 200));
});
