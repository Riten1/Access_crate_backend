import Event from "../../../models/event.model.js";
import Ticket from "../../../models/ticket.model.js";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

export const createTicket = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { ticketType, price, quantity, sales_start_date, sales_end_date } =
    req.body;

  if (
    !ticketType ||
    !price ||
    !quantity ||
    !sales_start_date ||
    !sales_end_date
  ) {
    return res
      .status(400)
      .json(new ApiError(false, "All fields are required", null, 400));
  }

  if (!eventId) {
    return res
      .status(400)
      .json(new ApiError(false, "Event ID is required", null, 400));
  }

  const event = await Event.findById(eventId);

  if (!event) {
    return res
      .status(400)
      .json(new ApiError(false, "Event not found", null, 400));
  }

  const ticket = await Ticket.findOne({
    ticketType,
  });

  if (ticket) {
    return res
      .status(400)
      .json(new ApiError(false, "Ticket type already exists", null, 400));
  }

  if (sales_start_date > sales_end_date) {
    return res
      .status(400)
      .json(
        new ApiError(
          false,
          "Sales start date cannot be greater than sales end date",
          null,
          400
        )
      );
  }

  // if (
  //   ticketType !== "VIP" ||
  //   ticketType !== "General" ||
  //   ticketType !== "First Phase" ||
  //   ticketType !== "Second Phase" ||
  //   ticketType !== "Third Phase"
  // ) {
  //   return res
  //     .status(400)
  //     .json(new ApiError(false, "Invalid ticket type", null, 400));
  // }

  const currentDate = new Date();
  const isActive =
    currentDate >= new Date(sales_start_date) &&
    currentDate <= new Date(sales_end_date);

  const newTicket = await Ticket.create({
    event: eventId,
    ticketType,
    price,
    quantity,
    sales_start_date,
    sales_end_date,
    isActive,
  });

  const sameEvent = await Event.findById(eventId);

  if (sales_start_date > sameEvent.date) {
    return res
      .status(400)
      .json(new ApiError(false, "Invalid date range", null, 400));
  }

  if (currentDate > new Date(sales_end_date)) {
    await Ticket.findByIdAndUpdate(newTicket._id, { isActive: false });
  }
  return res
    .status(200)
    .json(new ApiResponse(true, "Ticket created successfully", newTicket, 201));
});

export const getTickets = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  if (!eventId) {
    return res
      .status(400)
      .json(new ApiError(false, "Event ID is required", null, 400));
  }

  const tickets = await Ticket.find({ event: eventId })
    .populate("event", "-__v")
    .select("-__v");
  return res
    .status(200)
    .json(new ApiResponse(true, "Tickets fetched successfully", tickets, 200));
});

export const updateTicket = asyncHandler(async (req, res) => {
  const { ticketId, eventId } = req.params;
  let { ticketType, price, quantity, sales_start_date, sales_end_date } =
    req.body;

  if (!ticketId) {
    return res
      .status(400)
      .json(new ApiError(false, "Ticket ID is required", null, 400));
  }

  if (!eventId) {
    return res
      .status(400)
      .json(new ApiError(false, "Event ID is required", null, 400));
  }

  // Convert strings to Date objects and check if they are valid
  sales_start_date = new Date(sales_start_date);
  sales_end_date = new Date(sales_end_date);

  if (isNaN(sales_start_date.getTime()) || isNaN(sales_end_date.getTime())) {
    return res
      .status(400)
      .json(new ApiError(false, "Invalid sales start or end date", null, 400));
  }

  // const duplicateTicket = await Ticket.findOne({
  //   ticketType,
  // });

  // if (duplicateTicket) {
  //   return res
  //     .status(400)
  //     .json(new ApiError(false, "Ticket type already exists", null, 400));
  // }
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    return res
      .status(400)
      .json(new ApiError(false, "Ticket not found", null, 400));
  }

  if (ticket.event.toString() !== eventId) {
    return res
      .status(400)
      .json(
        new ApiError(false, "Ticket does not belong to this event", null, 400)
      );
  }

  const currentDate = new Date();
  const sameEvent = await Event.findById(eventId);

  const isActive =
    currentDate >= new Date(sales_start_date) &&
    currentDate <= new Date(sales_end_date);

  if (currentDate > new Date(sales_end_date)) {
    await Ticket.findByIdAndUpdate(ticketId, { isActive: false });
  }
  if (!sameEvent || isNaN(new Date(sameEvent.date).getTime())) {
    return res
      .status(400)
      .json(new ApiError(false, "Invalid event date", null, 400));
  }

  const eventDate = new Date(sameEvent.date);

  if (sales_start_date > eventDate) {
    return res
      .status(400)
      .json(
        new ApiError(
          false,
          "Sales start date can't be greater than event date",
          null,
          400
        )
      );
  }

  if (sales_end_date > eventDate) {
    return res
      .status(400)
      .json(
        new ApiError(
          false,
          "Sales end date can't be greater than event date",
          null,
          400
        )
      );
  }

  if (sales_start_date > sales_end_date) {
    return res
      .status(400)
      .json(
        new ApiError(
          false,
          "Sales start date cannot be greater than sales end date",
          null,
          400
        )
      );
  }

  if (currentDate > sales_end_date) {
    await Ticket.findByIdAndUpdate(ticketId, { isActive: false });
  }

  const updatedTicket = await Ticket.findByIdAndUpdate(
    ticketId,
    {
      ticketType,
      price,
      quantity,
      sales_start_date,
      sales_end_date,
      isActive,     
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(true, "Ticket updated successfully", updatedTicket, 200)
    );
});

export const deleteTicket = asyncHandler(async (req, res) => {
  const { ticketId, eventId } = req.params;

  if (!eventId) {
    return res
      .status(400)
      .json(new ApiError(false, "Event ID is required", null, 400));
  }

  if (!ticketId) {
    return res
      .status(400)
      .json(new ApiError(false, "Ticket ID is required", null, 400));
  }

  const ticket = await Ticket.findById({ _id: ticketId, event: eventId });

  if (!ticket) {
    return res
      .status(400)
      .json(new ApiError(false, "Ticket not found", null, 400));
  }

  const deletedTicket = await Ticket.findByIdAndDelete(ticketId);

  return res
    .status(200)
    .json(
      new ApiResponse(true, "Ticket deleted successfully", deletedTicket, 200)
    );
});
