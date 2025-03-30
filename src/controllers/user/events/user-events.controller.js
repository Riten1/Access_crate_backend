import Event from "../../../models/event.model.js";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const getUserEvents = asyncHandler(async (req, res) => {
  let { search = "", category, page = 1, limit = 6 } = req.query;

  if (typeof search !== "string") {
    search = "";
  }

  const query = {
    $and: [{ name: { $regex: search, $options: "i" } }],
    date: { $gte: new Date() },
  };

  if (category) {
    query.$and.push({ category: category });
  }

  const events = await Event.find(query)
    .populate({ path: "category", select: "-__v" })
    .populate({ path: "organizer", select: "-__v -password -refreshtoken" })
    .populate("tickets", "-__v -event -createdAt -updatedAt")
    .select("-__v")
    .sort({ createdAt: -1 });

  const eventsWithTicketRange = events.map((event) => {
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
  if (events.length === 0) {
    return res
      .status(200)
      .json(new ApiError(false, `No events found`, [], 200));
  }

  const totalEvents = eventsWithTicketRange.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedEvents = eventsWithTicketRange.slice(startIndex, endIndex);

  return res.status(200).json(
    new ApiResponse(
      true,
      "Events fetched successfully",
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
