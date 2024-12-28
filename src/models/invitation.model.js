import mongoose from "mongoose";

const invitationModel = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "super-admin", "organizer"],
      default: "organizer",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    invitationToken: {
      type: String,
      required: true,
    },
    invitationExpiry: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Invitation = mongoose.model("invitation", invitationModel);

export default Invitation;
