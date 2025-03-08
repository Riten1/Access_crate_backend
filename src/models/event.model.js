import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  event_pic: {
    type: String,
    default: null,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  venue: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "eventCategory",
    trim: true,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: false,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "organizer",
    required: true,
  },
  interested: {
    type: Number,
    default: 0,
  },
  isEntryFree: {
    type: Boolean,
    default: false,
    required: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: ["current", "upcoming", "past"],
    default: "upcoming",
  },

  isTicketsAvailable: {
    type: Boolean,
    default: false,
    required: true,
  },

  tickets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ticket",
    },
  ],
});

eventSchema.pre("save", function (next) {
  const currentDate = new Date();
  const eventDate = new Date(this.date);

  currentDate.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  if (eventDate < currentDate) {
    this.eventType = "past";
    this.isActive = false;
  } else if (
    eventDate.getTime() === currentDate.getTime() &&
    (this.isEntryFree === true || this.isEntryFree === false)
  ) {
    this.eventType = "current";
    this.isActive = true;
  } else {
    this.eventType = "upcoming";
    this.isActive = false;
  }

  this.isTicketsAvailable = this.tickets && this.tickets.length > 0;

  next();
});

const Event = mongoose.model("event", eventSchema);

export default Event;
