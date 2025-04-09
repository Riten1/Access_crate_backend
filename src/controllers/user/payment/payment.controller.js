// import Payment from "../../../models/payment.model.js";
// import Ticket from "../../../models/ticket.model.js";
// import ApiError from "../../../utils/ApiError.js";
// import ApiResponse from "../../../utils/ApiResponse.js";
// import axios from "axios";

// export const initiatePayment = async (req, res) => {
//   try {
//     const { eventId, ticketId } = req.body;
//     const userId = req.user._id;

//     // Verify ticket exists and get price
//     const ticket = await Ticket.findById(ticketId);
//     if (!ticket) {
//       return res
//         .status(404)
//         .json(new ApiError(false, "Ticket not found", null, 404));
//     }

//     // Create payment record
//     const payment = await Payment.create({
//       user: userId,
//       event: eventId,
//       ticket: ticketId,
//       amount: ticket.price,
//     });

//     await payment.save();

//     res.status(200).json(
//       new ApiResponse(
//         true,
//         "Payment initiated",
//         {
//           paymentId: payment._id,
//           amount: ticket.price * 100, // Convert to paisa
//         },
//         200
//       )
//     );
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// export const verifyPayment = async (req, res) => {
//   try {
//     const { token, amount, paymentId } = req.body;

//     // Verify with Khalti
//     const response = await axios.post(
//       "https://khalti.com/api/v2/payment/verify/",
//       { token, amount },
//       {
//         headers: {
//           Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
//         },
//       }
//     );

//     // Update payment record
//     const payment = await Payment.findByIdAndUpdate(
//       paymentId,
//       {
//         status: "completed",
//         khaltiIdx: response.data.idx,
//         paymentDetails: response.data,
//       },
//       { new: true }
//     ).populate("user event ticket");

//     res.status(200).json({
//       success: true,
//       payment,
//     });
//   } catch (error) {
//     // Mark payment as failed - using req.body.paymentId since paymentId might be undefined
//     if (req.body.paymentId) {
//       await Payment.findByIdAndUpdate(
//         req.body.paymentId,
//         {
//           status: "failed",
//           errorDetails: error.response?.data || error.message,
//         },
//         { new: true }
//       );
//     }

//     res.status(400).json({
//       success: false,
//       error: error.response?.data || error.message,
//       paymentId: req.body.paymentId || null,
//     });
//   }
// };

// export const getPaymentHistory = async (req, res) => {
//   try {
//     const payments = await Payment.find({ user: req.user._id })
//       .populate("event ticket")
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       payments,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
// controllers/payment.controller.js
import Event from "../../../models/event.model.js";
import Payment from "../../../models/payment.model.js";
import Ticket from "../../../models/ticket.model.js";

export const initiateEsewaPayment = async (req, res) => {
  try {
    const { eventId, tickets, totalAmount } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!tickets?.length) {
      return res.status(400).json({ error: "At least one ticket required" });
    }

    // Validate event and tickets
    const [event, ticketDocs] = await Promise.all([
      Event.findById(eventId),
      Ticket.find({ _id: { $in: tickets.map((t) => t.ticketId) } }),
    ]);

    if (!event) return res.status(404).json({ error: "Event not found" });

    // Check ticket availability
    for (const item of tickets) {
      const ticket = ticketDocs.find((doc) => doc._id.equals(item.ticketId));
      if (!ticket)
        return res
          .status(404)
          .json({ error: `Ticket ${item.ticketId} not found` });
      if (ticket.sold_count + item.quantity > ticket.quantity) {
        return res.status(400).json({
          error: `Only ${ticket.quantity - ticket.sold_count} ${ticket.ticketType} tickets left`,
        });
      }
    }

    // Create payment (assuming schema supports arrays)
    const payment = await Payment.create({
      user: userId,
      event: eventId,
      paymentDetails: tickets.map((t) => ({
        ticket: t.ticketId,
        quantity: t.quantity,
        price: t.price, // make sure to send this from frontend or calculate from DB
      })),
      totalAmount,
      status: "pending",
    });

    // eSewa integration
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000"; // fallback if undefined

    const payload = {
      amount: totalAmount,
      tax_amount: 0,
      total_amount: totalAmount,
      transaction_uuid: payment._id.toString(),
      product_code: "EPAYTEST",
      success_url: `${frontendUrl}/events`,
      failure_url: `${frontendUrl}`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };

    // ⚠️ Encode the JSON payload before appending to URL
    const encodedPayload = encodeURIComponent(JSON.stringify(payload));

    const esewaUrl = `https://rc-epay.esewa.com.np/api/epay/main/v2/form?data=${encodedPayload}`;

    res.json({ paymentUrl: esewaUrl, paymentId: payment._id });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({
      error: error.message,
      validationError: error.errors, // Mongoose validation details
    });
  }
};

export const verifyEsewaPayment = async (req, res) => {
  try {
    const { transaction_uuid, total_amount, status } = req.body;

    // Find the payment record
    const payment = await Payment.findById(transaction_uuid)
      .populate("ticket")
      .populate("event");

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Verify amount matches
    if (payment.amount !== parseFloat(total_amount)) {
      return res.status(400).json({ error: "Amount mismatch" });
    }

    if (status === "COMPLETE") {
      // Update payment status
      payment.status = "completed";
      payment.esewaTransactionId = req.body.transaction_code;
      payment.paymentDetails = req.body;
      await payment.save();

      // Update ticket sold count
      await Ticket.findByIdAndUpdate(payment.ticket._id, {
        $inc: { sold_count: payment.quantity },
      });

      res.status(200).send("Payment verified successfully");
    } else {
      payment.status = "failed";
      await payment.save();
      res.status(400).send("Payment failed");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
