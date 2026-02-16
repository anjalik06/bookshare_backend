import { Router } from "express";
import { protect, AuthRequest } from "../middleware/auth";
import { Post } from "../models/Post";

const router = Router();

// Get posts for a community
router.get("/community/:id", protect, async (req: AuthRequest, res) => {
  try {
    const posts = await Post.find({ community: req.params.id }).populate("user", "name");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// Like a post
router.post("/:id/like", protect, async (req: AuthRequest, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Add the user's id to the likes array if not already liked
    if (!post.likes.includes(req.user._id)) {
      post.likes.push(req.user._id);
      await post.save();
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Failed to like post" });
  }
});

export default router;
