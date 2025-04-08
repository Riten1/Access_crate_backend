import Payment from "../../../models/payment.model.js";
import Ticket from "../../../models/ticket.model.js";
import ApiError from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import axios from "axios";

export const initiatePayment = async (req, res) => {
  try {
    const { eventId, ticketId } = req.body;
    const userId = req.user._id;

    // Verify ticket exists and get price
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res
        .status(404)
        .json(new ApiError(false, "Ticket not found", null, 404));
    }

    // Create payment record
    const payment = await Payment.create({
      user: userId,
      event: eventId,
      ticket: ticketId,
      amount: ticket.price,
    });

    await payment.save();

    res.status(200).json(
      new ApiResponse(
        true,
        "Payment initiated",
        {
          paymentId: payment._id,
          amount: ticket.price * 100, // Convert to paisa
        },
        200
      )
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { token, amount, paymentId } = req.body;

    // Verify with Khalti
    const response = await axios.post(
      "https://khalti.com/api/v2/payment/verify/",
      { token, amount },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        },
      }
    );

    // Update payment record
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: "completed",
        khaltiIdx: response.data.idx,
        paymentDetails: response.data,
      },
      { new: true }
    ).populate("user event ticket");

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    // Mark payment as failed - using req.body.paymentId since paymentId might be undefined
    if (req.body.paymentId) {
      await Payment.findByIdAndUpdate(
        req.body.paymentId,
        {
          status: "failed",
          errorDetails: error.response?.data || error.message,
        },
        { new: true }
      );
    }

    res.status(400).json({
      success: false,
      error: error.response?.data || error.message,
      paymentId: req.body.paymentId || null,
    });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate("event ticket")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
