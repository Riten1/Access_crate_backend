import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/user.model.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");

    if (!token) {
      throw new Error("Unauthorized");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshtoken -__v"
    );

    req.user = user;

    next();
  } catch (error) {
    throw error;
  }
});
