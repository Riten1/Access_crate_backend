import User from "../../../models/user.model.js";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { generateAccessAndRefreshTokens } from "../../user/auth/user.controller.js";
export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError("Email is required");
  }

  if (!password) {
    throw new ApiError("Password is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError("User not registered");
  }

  const isPasswordCorrect = user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError("Incorrect password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
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
