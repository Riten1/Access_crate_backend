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

export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate("event")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// controllers/payment.controller.js
import Event from "../../../models/event.model.js";
import Payment from "../../../models/payment.model.js";
import Ticket from "../../../models/ticket.model.js";
import { generateSignature } from "../../../utils/generateSignature.js";

export const initiateEsewaPayment = async (req, res) => {
  try {
    const { eventId, tickets } = req.body;
    const userId = req.user._id;
    // Validate tickets and calculate total amount
    let totalAmount = 0;
    const paymentDetails = [];

    for (const item of tickets) {
      const ticket = await Ticket.findById(item.ticketId);
      if (!ticket) {
        return res
          .status(404)
          .json({ message: `Ticket ${item.ticketId} not found` });
      }

      // Check ticket availability
      if (ticket.sold_count + item.quantity > ticket.quantity) {
        return res.status(400).json({
          message: `Not enough ${ticket.ticketType} tickets available`,
        });
      }

      totalAmount += ticket.price * item.quantity;
      paymentDetails.push({
        ticket: item.ticketId,
        quantity: item.quantity,
        price: ticket.price,
      });
    }

    // Create payment record
    const payment = await Payment.create({
      user: userId,
      event: eventId,
      paymentDetails,
      totalAmount,
      status: "pending",
    });

    await payment.save();

    // Prepare eSewa parameters
    const params = {
      amount: totalAmount,
      tax_amount: 0,
      total_amount: totalAmount,
      transaction_uuid: payment._id.toString(),
      product_code: process.env.ESEWA_MERCHANT_CODE || "EPAYTEST",
      product_service_charge: 0,
      product_delivery_charge: 0,
      success_url: `${process.env.FRONTEND_URL}/payment/success?pid=${payment._id}`,
      failure_url: `${process.env.FRONTEND_URL}/payment/failure?pid=${payment._id}`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };

    // Generate signature
    try {
      // Generate signature with error handling
      params.signature = generateSignature(params);
    } catch (signatureError) {
      console.error("Signature generation failed:", signatureError);
      return res.status(500).json({
        message: "Payment processing failed",
        error: signatureError.message,
      });
    }

    res.json({
      paymentUrl: `${process.env.ESEWA_SANDBOX_URL}/epay/main`,
      params,
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// controllers/paymentController.ts
export const verifyEsewaPayment = async (req, res) => {
  try {
    const { pid, oid, amt, refId } = req.query;

    // Find payment with necessary relations
    const payment = await Payment.findById(pid)
      .populate("event")
      .populate("paymentDetails.ticket");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Verify with eSewa API
    const verificationUrl = `${process.env.ESEWA_SANDBOX_URL}/api/epay/transaction/status`;
    const verificationParams = {
      amt: payment.totalAmount,
      rid: refId,
      pid: payment._id.toString(),
      scd: process.env.ESEWA_MERCHANT_CODE || "EPAYTEST",
    };

    const verificationResponse = await axios.post(
      verificationUrl,
      verificationParams
    );

    if (verificationResponse.data.response_code === "Success") {
      // Update payment status
      payment.status = "completed";
      payment.esewaTransactionId = oid;
      await payment.save();

      // Update ticket counts
      for (const item of payment.paymentDetails) {
        await Ticket.findByIdAndUpdate(item.ticket._id, {
          $inc: { sold_count: item.quantity },
        });
      }

      // Check event status
      await checkEventStatus(payment.event._id);

      return res.json({
        success: true,
        redirectUrl: `${process.env.FRONTEND_URL}/payment/success?pid=${pid}`,
      });
    } else {
      payment.status = "failed";
      await payment.save();
      return res.json({
        success: false,
        redirectUrl: `${process.env.FRONTEND_URL}/payment/failure?pid=${pid}`,
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function
async function checkEventStatus(eventId) {
  const event = await Event.findById(eventId).populate("tickets");
  const allTicketsSold = event.tickets.every(
    (ticket) => ticket.sold_count >= ticket.quantity
  );

  if (allTicketsSold) {
    await Event.findByIdAndUpdate(eventId, {
      isTicketsAvailable: false,
      isActive: false,
    });
  }
}
