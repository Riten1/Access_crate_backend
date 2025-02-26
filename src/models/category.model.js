import mongoose from "mongoose";

const eventCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
});

const EventCategory = mongoose.model("eventCategory", eventCategorySchema);

export default EventCategory;
