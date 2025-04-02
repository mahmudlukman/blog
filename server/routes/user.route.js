import express from "express";
import {
  getUserSavedPosts,
  loginUser,
  logoutUser,
  registerUser,
  savedPosts,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthenticated, logoutUser);
userRouter.get("/saved", isAuthenticated, getUserSavedPosts);
userRouter.put("/save", isAuthenticated, savedPosts);

export default userRouter;
