import { resolvePath } from "react-router-dom";
import User from "../../../models/user.model.js";
import ApiError from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { generateAccessAndRefreshTokens } from "../../user/auth/user.controller.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import SuperAdmin from "../../../models/super-admin.model.js";

export const generateAccessAndRefreshTokensSuperAdmin = async (userId) => {
  try {
    const superAdmin = await SuperAdmin.findById(userId);
    const accessToken = superAdmin.generateAccessToken();
    const refreshToken = superAdmin.generateRefreshToken();

    superAdmin.refreshtoken = refreshToken;
    await superAdmin.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(false, "Failed to generate tokens", null, 500);
  }
};

export const superAdminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res
      .status(400)
      .json(new ApiError(false, "Email is required", null, 400));
  }

  if (!password) {
    return res
      .status(400)
      .json(new ApiError(false, "Password is required", null, 400));
  }

  if (email !== "griten186@gmail.com") {
    return res
      .status(404)
      .json(new ApiError(false, "No Super Admin found", null, 400));
  }

  let superAdmin = await SuperAdmin.findOne({ email });

  if (!superAdmin) {
    superAdmin = await SuperAdmin.create({
      email: "griten186@gmail.com",
      password,
      role: "super-admin",
    });
  }
  const isPasswordCorrect = await superAdmin.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    return res
      .status(400)
      .json(new ApiError(false, "Incorrect password", null, 401));
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokensSuperAdmin(superAdmin._id);

  const superAdminCreated = await SuperAdmin.findById(superAdmin._id).select(
    "-password -refreshtoken -__v"
  );
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        true,
        "Login successful",
        { superAdminCreated, accessToken, refreshToken },
        200
      )
    );
});
