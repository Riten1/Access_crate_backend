import User from "../models/user.model.js";
import uploadOnCloudinary from "../services/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asycHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const generateAccessAndRefreshTokens = async (userId) => {
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

//register user
export const registerUser = asycHandler(async (req, res) => {
  const { full_name, email, password, contact_info, address } = req.body;

  if (!full_name || !email || !password || !contact_info || !address) {
    throw new ApiError(false, "All fields are required", null, 400);
  }

  const duplicateUser = await User.findOne({
    $or: [{ email }, { contact_info }],
  });

  if (duplicateUser) {
    throw new ApiError(
      false,
      "User with provided email, contact info, or address already exists",
      409
    );
  }

  const profileImageLocalFile = req.files?.profile_pic[0].path;
  if (!profileImageLocalFile) {
    throw new ApiError(false, "Profile picture is required", 400);
  }

  const profileImageCloudinaryResponse = await uploadOnCloudinary(
    profileImageLocalFile
  );

  if (!profileImageCloudinaryResponse?.url) {
    throw new ApiError(false, "Failed to upload profile image", null, 500);
  }

  const user = await User.create({
    full_name,
    email,
    password,
    contact_info,
    address,
    profile_pic: profileImageCloudinaryResponse.url,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(
      false,
      "Something went wrong while creating user",

      500
    );
  }

  if (createdUser) {
    return res
      .status(200)
      .json(new ApiResponse(true, "User created", createdUser, 200));
  }
});

//login user
export const loginUser = asycHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(false, "Email is required", null, 400);
  }

  if (!password) {
    throw new ApiError(false, "Password is required", null, 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(false, "User not registered", null, 404);
  }

  const isPasswordCorrect = user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(false, "Incorrect password", null, 401);
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshtoken -__v"
  );

  if (!loggedInUser) {
    throw new ApiError(
      false,
      "Something went wrong while logging in user",
      null,
      500
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

export const getUsers = asycHandler(async (req, res) => {
  const users = await User.find().select(
    "-password -refreshtoken -__v -accessToken"
  );

  return res
    .status(200)
    .json(new ApiResponse(true, "Users fetched successfully", users, 200));
});

export const logoutUser = asycHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshtoken: undefined },
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

export const getCurrentUser = asycHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshtoken -__v"
  );

  if (!user) {
    throw new ApiError(false, "User not found", null, 404);
  }
  return res
    .status(200)
    .json(new ApiResponse(true, "User fetched successfully", user, 200));
});

export const updateUserProfile = asycHandler(async (req, res) => {
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
    throw new ApiError(false, "User not found", null, 404);
  }

  return res
    .status(200)
    .json(new ApiResponse(true, "User updated successfully", user, 200));
});
