import ApiError from "../utils/ApiError.js";

export const checkRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    throw res.status(401).json(new ApiError(false, "Unauthorized", null, 401));
  }
  next();
};
