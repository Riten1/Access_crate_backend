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
        instagram: 1,
        facebook: 1,
        youtube: 1,
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
  ]);

  const organizer = organizers.find((org) => org._id.toString() === id);

  if (!organizer) {
    return res
      .status(404)
      .json(new ApiError(false, "Organizer not found", null, 404));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(true, "Organizer fetched successfully", organizer, 200)
    );
});

export const getOrganizerEvents = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { eventType, page = 1, limit = 10 } = req.query;

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
    eventsWithTicketRange = eventsWithTicketRange.filter(
      (event) => event.date < new Date()
    );
  }

  if (eventType === "upcoming") {
    eventsWithTicketRange = eventsWithTicketRange.filter(
      (event) => event.date > new Date()
    );
  }

  if (!eventsWithTicketRange.length) {
    return res
      .status(200)
      .json(new ApiError(false, "No events found", [], 400));
  }

  const totalEvents = eventsWithTicketRange.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedEvents = eventsWithTicketRange.slice(startIndex, endIndex);

  return res.status(200).json(
    new ApiResponse(
      true,
      "Organizer events fetched successfully",
      {
        totalEvents,
        currentPage: Number(page),
        totalPages: Math.ceil(totalEvents / limit),
        limit,
        events: paginatedEvents,
      },
      200
    )
  );
});

export const getUserOrganizers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 8, search } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);
  const skip = (pageNumber - 1) * limitNumber;

  const pipeline = [];

  // Add search filter if search is provided
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { organizer_name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  pipeline.push(
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
    { $skip: skip },
    { $limit: limitNumber }
  );

  const organizers = await Organizer.aggregate(pipeline);

  const totalCount = await Organizer.countDocuments(
    search
      ? {
          $or: [
            { organizer_name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {}
  );

  return res.status(200).json({
    success: true,
    message: "Organizers fetched successfully",
    totalPages: Math.ceil(totalCount / limitNumber),
    currentPage: pageNumber,
    totalResults: totalCount,
    limit: limitNumber,
    data: organizers,
  });
});
