import User from "../models/user.model.js";
import uploadOnCloudinary from "../services/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asycHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

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
