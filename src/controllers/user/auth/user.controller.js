import User from "../../../models/user.model.js";
import uploadOnCloudinary from "../../../services/cloudinary.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import ApiError from "../../../utils/ApiError.js";
import jwt from "jsonwebtoken";
// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import { OAuth2Client } from "google-auth-library";

export const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshtoken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(false, "Failed to generate tokens", null, 500);
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res
      .status(400)
      .json(new ApiError(false, "All fields are required", null, 400));
  }

  const duplicateUser = await User.findOne({
    $or: [{ email }],
  });

  if (duplicateUser) {
    return res
      .status(400)
      .json(
        new ApiError(false, "User with the provided email  already exists", 400)
      );
  }

  let profile_pic_url = null;
  if (req.files?.profile_pic && req.files.profile_pic.length > 0) {
    const profileImageLocalFile = req.files.profile_pic[0].path;

    const profileImageCloudinaryResponse = await uploadOnCloudinary(
      profileImageLocalFile
    );

    if (!profileImageCloudinaryResponse?.url) {
      return res
        .status(500)
        .json(new ApiError(false, "Failed to upload profile image", null, 500));
    }

    profile_pic_url = profileImageCloudinaryResponse.url;
  }

  const user = await User.create({
    full_name,
    email,
    password: password,
  });
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    return res
      .status(500)
      .json(
        new ApiError(false, "Something went wrong while creating user", 500)
      );
  }
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        true,
        "User registered successfully",
        { user: createdUser, accessToken, refreshToken },
        200
      )
    );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);

  if (!email) {
    throw res
      .status(400)
      .json(new ApiError(false, "Email is required", null, 400));
  }

  if (!password) {
    throw res
      .status(400)
      .json(new ApiError(false, "Password is required", null, 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw res
      .status(404)
      .json(new ApiError(false, "User not registered", null, 404));
  }

  const isPasswordCheck = await user.isPasswordCorrect(password);

  if (!isPasswordCheck) {
    return res
      .status(401)
      .json(new ApiError(false, "Incorrect password", null, 401));
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshtoken -__v"
  );

  if (!loggedInUser) {
    return res
      .status(500)
      .json(
        new ApiError(
          false,
          "Something went wrong while logging in user",
          null,
          500
        )
      );
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        true,
        "User Login successfull",
        { user: loggedInUser, accessToken, refreshToken },
        200
      )
    );
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select(
    "-password -refreshtoken -__v -accessToken"
  );

  return res
    .status(200)
    .json(new ApiResponse(true, "Users fetched successfully", users, 200));
});

export const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshtoken: null },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(true, "User logged out successfully", {}, 200));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshtoken -__v"
  );

  if (!user) {
    return res
      .status(404)
      .json(new ApiError(false, "User not found", null, 404));
  }
  return res
    .status(200)
    .json(new ApiResponse(true, "User fetched successfully", user, 200));
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { full_name, contact_info, address } = req.body;

  const pofilePicPath = req.file?.path;

  const profileImageCloudinaryResponse =
    await uploadOnCloudinary(pofilePicPath);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        full_name,
        contact_info,
        address,
        profile_pic: profileImageCloudinaryResponse?.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshtoken -__v");

  if (!user) {
    return res
      .status(404)
      .json(new ApiError(false, "User not found", null, 404));
  }

  return res
    .status(200)
    .json(new ApiResponse(true, "Profile updated successfully", user, 200));
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword) {
    return res
      .status(400)
      .json(new ApiError(false, "Current password is required", null, 400));
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

  const user = await User.findOne(req.user._id);

  if (!user) {
    return res
      .status(404)
      .json(new ApiError(false, "User not found", null, 404));
  }

  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) {
    return res
      .status(401)
      .json(new ApiError(false, "Incorrect current password", {}, 401));
  }

  if (newPassword === currentPassword) {
    return res
      .status(400)
      .json(
        new ApiError(
          false,
          "New password cannot be same as current password",
          {},
          400
        )
      );
  }

  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json(
        new ApiError(
          false,
          "New password and confirm password do not match",
          {},
          400
        )
      );
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(true, "Password changed successfully", {}, 200));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    returnres.json(new ApiError(false, "Unauthorized access", {}, 401));
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_EXPIRY
    );

    const user = await User.findById(decodedToken?._id);

    if (incommingRefreshToken !== user.refreshtoken) {
      return res.json(new ApiError(false, "Token expired", 401));
    }

    const { newRefreshToken, accessToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
      })
      .json(
        new ApiResponse(true, {
          accessToken,
          refreshtoken: newRefreshToken,
        })
      );
  } catch (error) {
    throw error;
  }
});
