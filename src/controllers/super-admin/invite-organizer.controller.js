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
    return res
      .status(400)
      .json(new ApiError(false, "Organizer Name is required", null, 400));
  }

  if (!organizerEmail) {
    return res
      .status(400)
      .json(new ApiError(false, "Organizer Email is required", null, 400));
  }

  if (!ownerName) {
    return res
      .status(400)
      .json(new ApiError(false, "Owner Name is required", null, 400));
  }

  if (contact_info && contact_info.includes(" ")) {
    return res
      .status(400)
      .json(
        new ApiError(false, "Contact info should not contain spaces", null, 400)
      );
  }

  const existingUser = await Invitation.findOne({ email: organizerEmail });
  const existingInvitation = await Invitation.findOne({
    email: organizerEmail,
    // role: "organizer",
  });

  if (existingUser || existingInvitation) {
    return res
      .status(400)
      .json(
        new ApiError(
          false,
          "Organizer already invited or registered",
          null,
          400
        )
      );
  }

  const invitationToken = crypto.randomBytes(32).toString("hex");
  const invitationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const invitedOrganizer = await Invitation.create({
    full_name: organizerName,
    email: organizerEmail,
    ownerName,
    contact_info,
    role: "organizer",
    status: "pending",
    invitedBy: req.user._id,
    invitationToken,
    invitationExpiry,
  });

  const frontendNavigationUrl = `${process.env.INVITATION_FRONTEND_NAVIGATION_URL}admin/invitation?token=${invitationToken}`;

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
    .json(new ApiResponse(true, "Invitation sent successfully", null, 200));
});

export const getInvitedOrganizers = asyncHandler(async (req, res) => {
  const invitedOrganizers = await Invitation.find({
    invitedBy: req.user._id,
  }).select("-invitationToken -invitationExpiry -__v");

  if (!invitedOrganizers) {
    return res
      .status(400)
      .json(new ApiError(false, "Invited organizers not found", null, 400));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        true,
        "Invited organizers fetched successfully",
        invitedOrganizers,
        200
      )
    );
});

export const reInviteOrganizer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invitedOrganizer = await Invitation.findById(id);

  if (!invitedOrganizer) {
    return res
      .status(400)
      .json(new ApiError(false, "Invited organizer not found", null, 400));
  }

  if (invitedOrganizer.status === "accepted") {
    return res
      .status(400)
      .json(new ApiError(false, "Invitation already accepted", null, 400));
  }

  const invitationToken = crypto.randomBytes(32).toString("hex");
  const invitationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  invitedOrganizer.invitationToken = invitationToken;
  invitedOrganizer.invitationExpiry = invitationExpiry;

  await invitedOrganizer.save();

  const frontendNavigationUrl = `${process.env.INVITATION_FRONTEND_NAVIGATION_URL}admin/invitation?token=${invitationToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.MY_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Access Crate" <${process.env.MY_EMAIL}>`,
    to: invitedOrganizer.email,
    subject: "You're invited to join Access Crate",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="text-align: center;">You are Invited!</h2>
        
        <p style="margin-bottom: 20px;">Dear ${invitedOrganizer.organizer_name},</p>

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
    .json(new ApiResponse(true, "Invitation sent successfully", null, 200));
});
