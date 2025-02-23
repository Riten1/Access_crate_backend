import Organizer from "../../../models/admin.model.js";
import Invitation from "../../../models/invitation.model.js";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const generateAccessAndRefreshTokensAdmin = async (userId) => {
  try {
    const organizer = await Organizer.findById(userId);
    const accessToken = organizer.generateAccessToken();
    const refreshToken = organizer.generateRefreshToken();

    organizer.refreshtoken = refreshToken;
    await organizer.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(false, "Failed to generate tokens", null, 500);
  }
};

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
    return res
      .status(400)
      .json(
        new ApiError(false, "Invalid invitation token or expired", null, 400)
      );
  }

  let existingOrganizer = await Organizer.findOne({ email: invitedUser.email });

  if (existingOrganizer) {
    return res
      .status(400)
      .json(new ApiError(false, "Organizer already exists", null, 400));
  }

  existingOrganizer = await Organizer.create({
    organizer_name: invitedUser.full_name,
    email: invitedUser.email,
    password,
    contact_info: invitedUser.contact_info,
    address: invitedUser.address,
    role: "organizer",
    owner_name: invitedUser.ownerName,
  });
  await existingOrganizer.save();

  invitedUser.status = "accepted";
  await invitedUser.save();

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokensAdmin(existingOrganizer._id);

  const updatedUser = await Organizer.findById(existingOrganizer._id).select(
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
        "User is now both 'user' and 'organizer'",
        {
          admin: updatedUser,
          accessToken,
          refreshToken,
        },
        200
      )
    );
});
