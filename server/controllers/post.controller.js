import cloudinary from "cloudinary";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import tryCatch from "../middleware/tryCatch.js";
import { sendError } from "../middleware/error.js";

export const getPosts = tryCatch(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;

  const query = {};

  const cat = req.query.cat;
  const author = req.query.author;
  const searchQuery = req.query.search;
  const sortQuery = req.query.sort;
  const featured = req.query.featured;

  if (cat) {
    query.category = cat;
  }

  if (searchQuery) {
    query.title = { $regex: searchQuery, $options: "i" };
  }

  if (author) {
    const user = await User.findOne({ name: author }).select("_id");

    if (!user) {
      return sendError(res, "User not found!");
    }

    query.user = user._id;
  }

  let sortObj = { createdAt: -1 };

  if (sortQuery) {
    switch (sortQuery) {
      case "newest":
        sortObj = { createdAt: -1 };
        break;
      case "oldest":
        sortObj = { createdAt: 1 };
        break;
      case "popular":
        sortObj = { visit: -1 };
        break;
      case "trending":
        sortObj = { visit: -1 };
        query.createdAt = {
          $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
        };
        break;
      default:
        break;
    }
  }

  if (featured) {
    query.isFeatured = true;
  }

  const posts = await Post.find(query)
    .populate("user", "name")
    .sort(sortObj)
    .limit(limit)
    .skip((page - 1) * limit);

  const totalPosts = await Post.countDocuments();
  const hasMore = page * limit < totalPosts;

  res.status(200).json({ success: true, posts, hasMore });
});

export const getPost = tryCatch(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).populate(
    "user",
    "name avatar"
  );
  res.status(200).json({ success: true, post });
});

export const createPost = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return sendError(res, "User not found!");
  }

  // Extract the post fields directly
  const { title, desc, category, content, image } = req.body;

  let slug = title.replace(/ /g, "-").toLowerCase();

  let existingPost = await Post.findOne({ slug });

  let counter = 2;

  while (existingPost) {
    slug = `${slug}-${counter}`;
    existingPost = await Post.findOne({ slug });
    counter++;
  }

  let imageData = null;
  if (image) {
    const myCloud = await cloudinary.v2.uploader.upload(image, {
      folder: "posts",
      width: 150,
    });
    imageData = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  const newPost = await Post.create({
    user: user._id,
    title,
    slug,
    desc,
    category,
    content,
    image: imageData,
  });

  res.status(200).json({ success: true, post: newPost });
});

export const updatePost = tryCatch(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  // Find the original post
  const post = await Post.findById(postId);

  if (!post) {
    return sendError(res, "Post not found!");
  }

  // Check if the user is authorized to update the post
  if (post.user.toString() !== userId.toString() && req.user.role !== "admin") {
    return sendError(
      res,
      "Unauthorized! You can only update your own posts.",
      403
    );
  }

  // Extract update data from request
  const { title, desc, category, content, image } = req.body;

  // Prepare update object
  const updateData = {
    title: title || post.title,
    desc: desc || post.desc,
    category: category || post.category,
    content: content || post.content,
  };

  // Handle slug update if title changes
  if (title && title !== post.title) {
    let slug = title.replace(/ /g, "-").toLowerCase();

    // Check if the new slug already exists (excluding current post)
    let existingPost = await Post.findOne({ slug, _id: { $ne: postId } });

    let counter = 2;
    while (existingPost) {
      slug = `${slug}-${counter}`;
      existingPost = await Post.findOne({ slug, _id: { $ne: postId } });
      counter++;
    }

    updateData.slug = slug;
  }

  // Handle image update
  if (image) {
    // Delete old image if it exists
    if (post.image && post.image.public_id) {
      await cloudinary.v2.uploader.destroy(post.image.public_id, {
        folder: "posts",
      });
    }

    // Upload new image
    const myCloud = await cloudinary.v2.uploader.upload(image, {
      folder: "posts",
      width: 150,
    });

    updateData.image = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  // Update the post
  const updatedPost = await Post.findByIdAndUpdate(postId, updateData, {
    new: true, // Return the updated document
    runValidators: true, // Run schema validators
  }).populate("user", "name avatar");

  res.status(200).json({
    success: true,
    message: "Post updated successfully",
    post: updatedPost,
  });
});

export const deletePost = tryCatch(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  // Find the post
  const post = await Post.findById(postId);

  if (!post) {
    return sendError(res, "Post not found!");
  }

  // Check if the user is the post owner or an admin
  const user = await User.findById(userId);

  if (!user) {
    return sendError(res, "User not found!");
  }

  // Allow deletion only if user is post owner or is an admin
  if (post.user.toString() !== userId.toString() && user.role !== "admin") {
    return sendError(
      res,
      "Unauthorized access! You can only delete your own posts.",
      403
    );
  }

  // Delete the post
  await post.deleteOne();

  // Delete the image from cloudinary if it exists
  if (post.image && post.image.public_id) {
    await cloudinary.v2.uploader.destroy(post.image.public_id, {
      folder: "posts",
    });
  }

  res.status(200).json({ success: true, message: "Post has been deleted" });
});

// admin
export const featurePost = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);
  const postId = req.body.postId;

  if (!user) {
    return sendError(res, "User not found!");
  }

  const post = await Post.findById(postId);

  if (!post) {
    return res.status(404).json("Post not found!");
  }

  const isFeatured = post.isFeatured;

  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    {
      isFeatured: !isFeatured,
    },
    { new: true }
  );

  res.status(200).json({ success: true, updatedPost });
});
