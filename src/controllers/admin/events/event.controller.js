import EventCategory from "../../../models/category.model.js";
import Event from "../../../models/event.model.js";
import uploadOnCloudinary from "../../../services/cloudinary.js";
import ApiError from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const createEvent = asyncHandler(async (req, res) => {
  const { name, description, date, venue, category, isEntryFree } = req.body;

  if (!name) {
    return res
      .status(400)
      .json(new ApiError(false, "Name is required", null, 400));
  }
  if (!req.file) {
    return res
      .status(400)
      .json(new ApiError(false, "Event Picture is required", null, 400));
  }
  if (!date) {
    return res
      .status(400)
      .json(new ApiError(false, "Event date is required", null, 400));
  }
  if (!venue) {
    return res
      .status(400)
      .json(new ApiError(false, "Event venue is required", null, 400));
  }
  if (!category) {
    return res
      .status(400)
      .json(new ApiError(false, "Event category is required", null, 400));
  }
  if (isEntryFree === undefined) {
    return res
      .status(400)
      .json(new ApiError(false, "isEntryFree is required", null, 400));
  }

  const duplicateEvent = await Event.findOne({ $or: [{ name }] });
  if (duplicateEvent) {
    return res
      .status(400)
      .json(new ApiError(false, "Event Already exists", 400));
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

  let isActive = isEntryFree ? true : false;

  try {
    const validCategory = await EventCategory.findById(category);
    if (!validCategory) {
      return res
        .status(400)
        .json(new ApiError(false, "Invalid category ID", null, 400));
    }
  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json(
          new ApiError(false, `Invalid category ID: ${error.value}`, null, 400)
        );
    }
    return res
      .status(500)
      .json(new ApiError(false, "Internal Server Error", null, 500));
  }
  const currentDate = new Date();
  const eventDate = new Date(date);

  currentDate.setHours(0, 0, 0, 0);

  if (eventDate < currentDate) {
    return res
      .status(400)
      .json(new ApiError(false, "Event date cannot be in the past", null, 400));
  }

  const event = await Event.create({
    name,
    event_pic: event_pic_url,
    description,
    date,
    venue,
    category,
    isEntryFree,
    isActive,
    organizer: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiError(true, "Event created successfully", event, 200));
});

export const getEvents = asyncHandler(async (req, res) => {
  const events = await Event.find()
    .populate({
      path: "category",
      select: "-__v",
    })
    .populate({
      path: "organizer",
      select: "-__v -password -refreshtoken",
    })
    .select("-__v");

  if (!events) {
    return res
      .status(400)
      .json(new ApiError(false, "Events not found", null, 400));
  }
  return res
    .status(200)
    .json(new ApiError(true, "Events fetched successfully", events, 200));
});
