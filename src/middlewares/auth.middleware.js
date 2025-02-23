import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import Organizer from "../models/admin.model.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is missing. Unauthorized access.",
      });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshtoken -__v"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Unauthorized access.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
      });
    }
    console.error("Error verifying token:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during authentication.",
    });
  }
});

export const verifyJwtAdmin = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is missing. Unauthorized access.",
      });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const organizer = await Organizer.findById(decodedToken._id).select(
      "-password -refreshtoken -__v"
    );

    if (!organizer) {
      return res.status(401).json({
        success: false,
        message: "Organizer not found. Unauthorized access.",
      });
    }

    req.organizer = organizer;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please log in again.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "An error occurred during authentication.",
    });
  }
});
