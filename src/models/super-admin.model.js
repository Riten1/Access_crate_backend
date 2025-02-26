import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const superAdminSchema = new mongoose.Schema(
  {
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
    },
    role: {
      type: String,
      required: true,
      enum: ["user", "super-admin", "organizer"],
      default: "user",
    },
    refreshtoken: {
      type: String,
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

superAdminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

superAdminSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

superAdminSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET_SUPER_ADMIN,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY_SUPER_ADMIN,
    }
  );
};

superAdminSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET_SUPER_ADMIN,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY_SUPER_ADMIN,
    }
  );
};

const SuperAdmin = mongoose.model("superadmin", superAdminSchema);

export default SuperAdmin;
