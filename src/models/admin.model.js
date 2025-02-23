import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const adminSchema = new mongoose.Schema(
  {
    organizer_name: {
      type: String,
      required: true,
      trim: true,
    },
    profile_pic: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "super-admin", "organizer"],
      default: "organizer",
      required: true,
    },
    refreshtoken: {
      type: String,
      default: null,
    },
    contact_info: {
      type: String,
      unique: true,
      default: null,
      trim: true,
    },
    owner_name: {
      type: String,
      unique: false,
      default: null,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

adminSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

adminSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET_ADMIN,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY_ADMIN,
    }
  );
};

adminSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET_ADMIN,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY_ADMIN,
    }
  );
};

const Organizer = mongoose.model("organizer", adminSchema);

export default Organizer;
