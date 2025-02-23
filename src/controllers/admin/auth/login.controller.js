import Organizer from "../../../models/admin.model.js";
import User from "../../../models/user.model.js";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
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
