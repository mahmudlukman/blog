import jwt from "jsonwebtoken";
import { sendError } from "./error.js";
import User from "../models/user.model.js";
import tryCatch from "./tryCatch.js";

// authenticated user
export const isAuthenticated = tryCatch(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return sendError(res, "Please login to access this resources");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (!decoded) {
    return sendError(res, "Access token is not valid");
  }

  req.user = await User.findById(decoded.id);

  next();
});

export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return sendError(res, "Only admins can access this resource");
  }
  next();
};
