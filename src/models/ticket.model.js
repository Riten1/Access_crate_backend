import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "event",
    },
    ticketType: {
      type: String,
      required: true,
      enum: ["VIP", "General", "First Phase", "Second Phase", "Third Phase"],
    },

    isActive: {
      type: Boolean,
      default: false,
    },

    sales_start_date: {
      type: Date,
      required: true,
    },

    sales_end_date: {
      type: Date,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    sold_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Ticket = mongoose.model("ticket", ticketSchema);

export default Ticket;
