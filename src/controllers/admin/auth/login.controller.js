import Organizer from "../../../models/admin.model.js";
import User from "../../../models/user.model.js";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { generateAccessAndRefreshTokens } from "../../user/auth/user.controller.js";
import { generateAccessAndRefreshTokensAdmin } from "./create-password.controller.js";
export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res
      .status(400)
      .json(new ApiError(false, "Email is required", {}, 400));
  }

  if (!password) {
    return res
      .status(400)
      .json(new ApiError(false, "Password is required", {}, 400));
  }

  if (email === "superadmin@gmail.com") {
    return res.status(400).json(new ApiError(false, "No Admin found", {}, 400));
  }

  const organizer = await Organizer.findOne({ email });

  if (!organizer) {
    return res
      .status(401)
      .json(new ApiError(false, "Organizer not registered", null, 401));
  }

  const isPasswordCorrect = await organizer.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    return res
      .status(400)
      .json(new ApiError(false, "Incorrect password", {}, 400));
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokensAdmin(organizer._id);

  const loggedInUser = await Organizer.findById(organizer._id).select(
    "-password -refreshtoken -__v"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
    })
    .json(
      new ApiResponse(
        true,
        "User logged in",
        { admin: loggedInUser, accessToken, refreshToken },
        200
      )
    );
});

export const sentOtpAdmin = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json(new ApiError(false, "Email is required", null, 400));
  }

  const organizer = await Organizer.findOne({ email });

  if (!organizer) {
    return res
      .status(404)
      .json(new ApiError(false, "Organizer not found", null, 404));
  }

  const otp = crypto.randomBytes(3).toString("hex");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.MY_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Access Crate" <${process.env.MY_EMAIL}>`,
    to: email,
    subject: "Forgot password OTP",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <p style="margin-bottom: 20px;">Your OTP is: <strong>${otp}</strong></p>
        <p>Note: This OTP is valid for 1 minute</p>
        <p style="margin-top: 20px;">Best regards,<br/>Access Crate Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  organizer.otp = otp;
  organizer.otpExpires = Date.now() + 60 * 1000;
  await organizer.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        true,
        "OTP sent successfully, check your email",
        null,
        200
      )
    );
});

export const verifyOtpAdmin = asyncHandler(async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  if (!otp) {
    return res
      .status(400)
      .json(new ApiError(false, "OTP is required", null, 400));
  }

  if (!newPassword) {
    return res
      .status(400)
      .json(new ApiError(false, "New password is required", null, 400));
  }

  if (!confirmPassword) {
    return res
      .status(400)
      .json(new ApiError(false, "Confirm password is required", null, 400));
  }

  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json(
        new ApiError(
          false,
          "New password and confirm password do not match",
          null,
          400
        )
      );
  }

  const organizer = await Organizer.findOne({ email });

  if (!organizer) {
    return res
      .status(404)
      .json(new ApiError(false, "Organizer not found", null, 404));
  }

  if (organizer.otp !== otp) {
    return res.status(400).json(new ApiError(false, "Invalid OTP", null, 400));
  }

  if (organizer.otpExpires < Date.now()) {
    return res
      .status(400)
      .json(new ApiError(false, "OTP has expired", null, 400));
  }

  organizer.password = newPassword;
  organizer.otp = undefined;
  organizer.otpExpires = undefined;

  await organizer.save();
  return res
    .status(200)
    .json(
      new ApiResponse(
        true,
        "Password reset successful. You can now log in with your new password.",
        null,
        200
      )
    );
});
