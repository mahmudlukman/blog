import User from "../models/user.model.js";
import { sendError } from "../middleware/error.js";
import { sendToken } from "../utils/jwtToken.js";
import tryCatch from "../middleware/tryCatch.js";

export const registerUser = tryCatch(async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) return sendError(res, "User already exists!");

  const user = await User.create({
    name: name,
    email: email,
    password: password,
  });
  sendToken(user, 201, res);
});

// Login user
export const loginUser = tryCatch(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, "Please provide the all fields!");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return sendError(res, "User doesn't exists!");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return sendError(res, "Please provide the correct information");
  }

  sendToken(user, 201, res);
});

export const logoutUser = tryCatch(async (req, res) => {
  res.cookie("token", "", {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: "none",
    // secure: true,
  });
  res.status(201).json({
    success: true,
    message: "Log out successful!",
  });
});

export const getUserSavedPosts = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id).populate("savedPosts");
  if (!user) return sendError(res, "User not found!");

  res.status(200).json({
    success: true,
    savedPosts: user.savedPosts,
  });
});

export const savedPosts = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return sendError(res, "User not found!");

  const { postId } = req.body;
  if (!postId) return sendError(res, "Please provide the post id!");

  const isPostSaved = user.savedPosts.some((post) => post === postId);

  if (isPostSaved) {
    await User.findByIdAndUpdate(user._id, {
      $pull: { savedPosts: postId },
    });
  } else {
    await User.findByIdAndUpdate(user._id, {
      $push: { savedPosts: postId },
    });
  }

  return res.status(200).json({
    success: true,
    message: isPostSaved
      ? "Post removed from saved posts"
      : "Post saved successfully",
  });
});
