import Organizer from "../../../models/admin.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const getTopTwoOrganizers = asyncHandler(async (req, res) => {
  const organizers = await Organizer.aggregate([
    {
      $lookup: {
        from: "events",
        localField: "_id",
        foreignField: "organizer",
        as: "events",
      },
    },
    {
      $addFields: {
        categoryIds: { $setUnion: "$events.category" },
      },
    },
    {
      $lookup: {
        from: "eventcategories",
        localField: "categoryIds",
        foreignField: "_id",
        as: "categoriesData",
      },
    },
    {
      $project: {
        _id: 1,
        organizer_name: 1,
        email: 1,
        profile_pic: 1,
        total_events: { $size: "$events" },
        categories: {
          $map: {
            input: "$categoriesData",
            as: "category",
            in: "$$category.name",
          },
        },
      },
    },

    {
      $sort: { total_events: -1 },
    },
    {
      $limit: 2,
    },
  ]);

  return res.status(200).json({
    success: true,
    message: "Top 2 organizers fetched successfully",
    data: organizers,
  });
});

export const remainingThreeTopOrganizers = asyncHandler(async (req, res) => {
  const organizers = await Organizer.aggregate([
    {
      $lookup: {
        from: "events",
        localField: "_id",
        foreignField: "organizer",
        as: "events",
      },
    },
    {
      $addFields: {
        categoryIds: { $setUnion: "$events.category" },
      },
    },
    {
      $lookup: {
        from: "eventcategories",
        localField: "categoryIds",
        foreignField: "_id",
        as: "categoriesData",
      },
    },
    {
      $project: {
        _id: 1,
        organizer_name: 1,
        email: 1,
        profile_pic: 1,
        total_events: { $size: "$events" },
        categories: {
          $map: {
            input: "$categoriesData",
            as: "category",
            in: "$$category.name",
          },
        },
      },
    },
    // Sort by event count descending
    { $sort: { total_events: -1 } },
    // Skip the top 2 organizers
    { $skip: 2 },
    // Limit to the next 3 organizers
    { $limit: 3 },
  ]);

  return res.status(200).json({
    success: true,
    message: "Top 3 organizers (excluding top 2) fetched successfully",
    data: organizers,
  });
});
