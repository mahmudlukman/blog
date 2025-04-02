import express from "express";
import {
  addComment,
  deleteComment,
  getPostComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { isAuthenticated } from "../middleware/auth.js";

const commentRouter = express.Router();

commentRouter.get("/post/:postId/comments", getPostComments);
commentRouter.post("/post/:postId/comment", isAuthenticated, addComment);
commentRouter.put("/comment/:commentId", isAuthenticated, updateComment);
commentRouter.delete("/comment/:commentId", isAuthenticated, deleteComment);

export default commentRouter;
