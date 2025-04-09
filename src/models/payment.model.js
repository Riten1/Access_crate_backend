// import mongoose from "mongoose";

// const paymentSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "user",
//       required: true,
//     },
//     event: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "event",
//       required: true,
//     },
//     ticket: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "ticket",
//         required: true,
//       },
//     ],
//     amount: {
//       type: Number,
//       required: true,
//     },
//     khaltiIdx: {
//       type: String,
//     },
//     status: {
//       type: String,
//       enum: ["initiated", "completed", "failed"],
//       default: "initiated",
//     },
//     paymentDetails: {
//       type: mongoose.Schema.Types.Mixed,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Update ticket sold_count after successful payment
// paymentSchema.post("save", async function (doc) {
//   if (doc.status === "completed") {
//     const Ticket = mongoose.model("ticket");
//     await Ticket.findByIdAndUpdate(doc.ticket, {
//       $inc: { sold_count: 1 },
//     });
//   }
// });

// const Payment = mongoose.model("Payment", paymentSchema);

// export default Payment;

// models/payment.model.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "event",
      required: true,
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ticket",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
    },
    esewaTransactionId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentDetails: [
      {
        ticket: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ticket",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Payment = mongoose.model("payment", paymentSchema);

export default Payment;
