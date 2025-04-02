import tryCatch from "../middleware/tryCatch.js";
import Comment from "../models/comment.model.js";
import User from "../models/user.model.js";

export const getPostComments = tryCatch(async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId })
    .populate("user", "name image")
    .sort({ createdAt: -1 });

  res.json(comments);
});

export const addComment = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);
  const postId = req.params.postId;
  const { desc } = req.body;

  if (!user) {
    return sendError(res, "User not found!");
  }

  if (!desc || desc.trim() === "") {
    return sendError(res, "Comment cannot be empty!");
  }

  const newComment = await Comment.create({
    desc,
    user: user._id,
    post: postId,
  });

  // Return the populated comment with user info
  const populatedComment = await Comment.findById(newComment._id)
    .populate("user", "name avatar");

  res.status(201).json({ success: true, comment: populatedComment });
});

export const updateComment = tryCatch(async (req, res) => {
  const { commentId } = req.params;
  const { desc } = req.body;
  const userId = req.user._id;

  if (!desc || desc.trim() === "") {
    return sendError(res, "Comment cannot be empty!");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return sendError(res, "Comment not found!");
  }

  // Only the comment author can edit their comment
  if (comment.user.toString() !== userId.toString()) {
    return sendError(res, "Unauthorized! You can only edit your own comments.", 403);
  }

  comment.desc = desc;
  await comment.save();

  const updatedComment = await Comment.findById(commentId)
    .populate("user", "name image");

  res.status(200).json({ success: true, comment: updatedComment });
});

export const deleteComment = tryCatch(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return sendError(res, "Comment not found!");
  }

  // Check if the user is the comment author or an admin
  if (comment.user.toString() !== userId.toString() && req.user.role !== "admin") {
    return sendError(res, "Unauthorized! You can only delete your own comments.", 403);
  }

  await Comment.findOneAndDelete({
    _id: commentId,
  });

  res.status(200).json({ success: true, message: "Comment deleted" });
});
