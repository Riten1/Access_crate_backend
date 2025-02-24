import { resolvePath } from "react-router-dom";
import User from "../../../models/user.model.js";
import ApiError from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { generateAccessAndRefreshTokens } from "../../user/auth/user.controller.js";
import ApiResponse from "../../../utils/ApiResponse.js";


export const superAdminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.json(new ApiError(false, "Email is required", null, 400));
  }

  if (!password) {
    return res.json(new ApiError(false, "Password is required", null, 400));
  }

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      full_name: "Super Admin",
      email,
      password,
      contact_info: "+9779826127253",
      address: "Pokhara Nepal",
      role: "super-admin",
    });
  }
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    return res
      .status(400)
      .json(new ApiError(false, "Incorrect password", null, 401));
  }

  if (email !== "superadmin@gmail.com") {
    return res
      .status(400)
      .json(new ApiError(false, "No superadmin found", null, 401));
  }

  if (user.contact_info !== "+9779826127253") {
    return res
      .status(401)
      .json(new ApiError(false, "No superadmin found", null, 401));
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const superAdmin = await User.findById(user._id).select(
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
        { superAdmin, accessToken, refreshToken },
        200
      )
    );
});


