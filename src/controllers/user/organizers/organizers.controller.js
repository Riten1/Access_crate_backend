import Organizer from "../../../models/admin.model.js";
import Event from "../../../models/event.model.js";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
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

    { $sort: { total_events: -1 } },

    { $skip: 2 },

    { $limit: 3 },
  ]);

  return res.status(200).json({
    success: true,
    message: "Top 3 organizers (excluding top 2) fetched successfully",
    data: organizers,
  });
});

export const getOrganizer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res
      .status(400)
      .json(new ApiError(false, "Organizer ID is required", null, 400));
  }

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
        owner_name: 1,
        contact_info: 1,
        total_events: { $size: "$events" },
        createdAt: 1,
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

  organizers.find((organizer) => {
    if (organizer._id == id) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            true,
            "Organizer fetched successfully",
            organizer,
            200
          )
        );
    }
  });
});

export const getOrganizerEvents = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { eventType } = req.query;

  if (!id) {
    return res
      .status(400)
      .json(new ApiError(false, "Organizer ID is required", null, 400));
  }
  if (!eventType) {
    return res
      .status(400)
      .json(new ApiError(false, "Event type is required", null, 400));
  }

  if (eventType !== "past" && eventType !== "upcoming") {
    return res
      .status(400)
      .json(
        new ApiError(
          false,
          "Invalid event type. Should be past or upcoming",
          null,
          400
        )
      );
  }

  const organizerEvents = await Event.find({ organizer: id }).populate(
    "tickets",
    "-__v -event -createdAt -updatedAt"
  );

  let eventsWithTicketRange = organizerEvents.map((event) => {
    const prices = event.tickets?.map((ticket) => ticket.price) || [];
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      ...event.toObject(),
      ticketRange: {
        lowest: lowestPrice,
        highest: highestPrice,
      },
    };
  });

  if (eventType === "past") {
    eventsWithTicketRange = await Event.find({
      organizer: id,
      date: { $lt: new Date() },
    });
  }

  if (eventType === "upcoming") {
    eventsWithTicketRange = await Event.find({
      organizer: id,
      date: { $gte: new Date() },
    });
  }

  if (!eventsWithTicketRange) {
    return res
      .status(400)
      .json(new ApiError(false, "Organizer not found", null, 400));
  }

  return res.status(200).json(
    new ApiResponse(
      true,
      "Organizer fetched successfully",

      eventsWithTicketRange,

      200
    )
  );
});
