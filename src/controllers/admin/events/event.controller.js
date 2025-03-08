import EventCategory from "../../../models/category.model.js";
import Event from "../../../models/event.model.js";
import uploadOnCloudinary from "../../../services/cloudinary.js";
import ApiError from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const createEvent = asyncHandler(async (req, res) => {
  const { name, description, date, venue, category, isEntryFree } = req.body;

  if (
    !name ||
    !req.file ||
    !date ||
    !venue ||
    !category ||
    isEntryFree === undefined
  ) {
    return res
      .status(400)
      .json(
        new ApiError(false, "All required fields must be filled", null, 400)
      );
  }

  const duplicateEvent = await Event.findOne({ name });
  if (duplicateEvent) {
    return res
      .status(400)
      .json(new ApiError(false, "Event already exists", null, 400));
  }

  const existingEvent = await Event.findOne({ date, venue });
  if (existingEvent) {
    return res
      .status(400)
      .json(
        new ApiError(
          false,
          "An event at this venue on the same date already exists",
          null,
          400
        )
      );
  }

  let event_pic_url = null;
  if (req.file) {
    const eventImageLocalFile = req.file.path;
    const eventImageCloudinaryResponse =
      await uploadOnCloudinary(eventImageLocalFile);
    if (!eventImageCloudinaryResponse?.url) {
      return res
        .status(500)
        .json(new ApiError(false, "Failed to upload event image", null, 500));
    }
    event_pic_url = eventImageCloudinaryResponse.url;
  }

  try {
    const validCategory = await EventCategory.findById(category);
    if (!validCategory) {
      return res
        .status(400)
        .json(new ApiError(false, "Invalid category ID", null, 400));
    }
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(false, "Internal Server Error", null, 500));
  }

  const event = await Event.create({
    name,
    event_pic: event_pic_url,
    description,
    date,
    venue,
    category,
    isEntryFree,
    organizer: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiError(true, "Event created successfully", event, 200));
});

export const getEvents = asyncHandler(async (req, res) => {
  const { eventType } = req.query;
  const organizerId = req.user._id;

  if (!eventType || !["past", "current", "upcoming"].includes(eventType)) {
    return res
      .status(400)
      .json(new ApiError(false, "Invalid or missing eventType", null, 400));
  }

  try {
    const events = await Event.find({ eventType, organizer: organizerId })
      .populate({
        path: "category",
        select: "-__v",
      })
      .populate({
        path: "organizer",
        select: "-__v -password -refreshtoken",
      })
      .select("-__v");

    if (events.length === 0) {
      return res
        .status(404)
        .json(new ApiError(false, `No ${eventType} events found`, null, 404));
    }

    return res
      .status(200)
      .json(
        new ApiError(
          true,
          `${eventType} events fetched successfully`,
          events,
          200
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(false, "Internal Server Error", null, 500));
  }
});

export const getCloserUpcomingEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ eventType: "upcoming" })
    .limit(4)
    .select("-__v");

  if (events.length === 0) {
    return res
      .status(404)
      .json(new ApiError(false, `No upcoming events found`, null, 404));
  }

  return res
    .status(200)
    .json(
      new ApiError(true, "Upcoming events fetched successfully", events, 200)
    );
});
