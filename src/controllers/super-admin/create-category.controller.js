import EventCategory from "../../models/category.model.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const createEventCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res
      .status(400)
      .json(new ApiError(false, "Name is required", null, 400));
  }

  const existedCategory = await EventCategory.findOne({ name });

  if (existedCategory) {
    return res
      .status(400)
      .json(new ApiError(false, "Category already exists", null, 400));
  }

  const category = await EventCategory.create({
    name,
    description,
  });

  return res
    .status(200)
    .json(new ApiError(true, "Category created successfully", null, 200));
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await EventCategory.aggregate([
    {
      $lookup: {
        from: "events",
        localField: "_id",
        foreignField: "category",
        as: "events",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        total_events: {
          $size: "$events",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(true, "Categories fetched successfully", categories));
});
