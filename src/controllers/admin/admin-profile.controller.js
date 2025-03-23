import Organizer from "../../models/admin.model.js";
import uploadOnCloudinary from "../../services/cloudinary.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getAdminProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res
      .status(400)
      .json(new ApiError(false, "Admin not found", null, 404));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(true, "Admin profile fetched successfully", req.user, 200)
    );
});

export const updateAdminProfile = asyncHandler(async (req, res) => {
  const { organizer_name, owner_name, contact_info } = req.body;

  if (contact_info && contact_info.includes(" ")) {
    return res
      .status(400)
      .json(
        new ApiError(false, "Contact info cannot contain spaces", null, 400)
      );
  }

  if (!organizer_name) {
    return res
      .status(400)
      .json(new ApiError(false, "Organizer name is required", null, 400));
  }

  if (!owner_name) {
    return res
      .status(400)
      .json(new ApiError(false, "Owner name is required", null, 400));
  }

  // if (!profile_pic) {
  //   return res
  //     .status(400)
  //     .json(new ApiError(false, "Profile pic is required", null, 400));
  // }

  const pofilePicPath = req.file?.path;

  const profileImageCloudinaryResponse =
    await uploadOnCloudinary(pofilePicPath);

  if (!profileImageCloudinaryResponse) {
    return res
      .status(400)
      .json(
        new ApiError(
          false,
          "Error uploading profile pic to cloudinary",
          null,
          400
        )
      );
  }

  const organizer = await Organizer.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        organizer_name,
        owner_name,
        contact_info,
        profile_pic: profileImageCloudinaryResponse?.url,
      },
    },
    {
      new: true,
    }
  ).select("-__v -password -refreshtoken");

  if (!organizer) {
    return res
      .status(400)
      .json(new ApiError(false, "Organizer not found", null, 400));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(true, "Organizer updated successfully", organizer, 200)
    );
});
