import Invitation from "../../../models/invitation.model.js";
import User from "../../../models/user.model.js";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { generateAccessAndRefreshTokens } from "../../user/auth/user.controller.js";

export const adminCreatePassword = asyncHandler(async (req, res) => {
  const { password, confirmPassword, invitationToken } = req.body;

  if (!password) {
    return res.json(new ApiError(false, "Password is required", null, 400));
  }

  if (!confirmPassword) {
    return res.json(
      new ApiError(false, "Confirm password is required", null, 400)
    );
  }

  if (password !== confirmPassword) {
    return res.json(new ApiError(false, "Passwords do not match", null, 400));
  }

  const invitedUser = await Invitation.findOne({ invitationToken });

  if (!invitedUser) {
    return res.json(new ApiError(false, "Invalid invitation token", null, 400));
  }

  const organizer = await User.create({
    full_name: invitedUser.full_name,
    email: invitedUser.email,
    password,
    contact_info: invitedUser.contact_info,
    address: invitedUser.address,
    role: "organizer",
  });

  await organizer.save();

  invitedUser.status = "accepted";
  await invitedUser.save();

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    organizer._id
  );
  const createdOrganizer = await User.findById(organizer._id).select(
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
        "Organizer account created successfully",
        {
          admin: createdOrganizer,
          accessToken,
          refreshToken,
        },
        200
      )
    );
});
