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
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
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
});

const Event = mongoose.model("event", eventSchema);

export default Event;
