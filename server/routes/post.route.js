import express from "express";
import {
  createPost,
  deletePost,
  featurePost,
  getPost,
  getPosts,
  updatePost,
} from "../controllers/post.controller.js";
import { isAuthenticated } from "../middleware/auth.js";
import increaseVisit from "../middleware/increaseVisit.js";

const postRouter = express.Router();

postRouter.get("/posts", getPosts);
postRouter.get("/post/:slug", increaseVisit, getPost);
postRouter.post("/create-post", isAuthenticated, createPost);
postRouter.put("/update-post/:postId", isAuthenticated, updatePost);
postRouter.delete("/delete/:postId", isAuthenticated, deletePost);
postRouter.put("/feature", isAuthenticated, featurePost);

export default postRouter;
