import express from "express";
import protect from "../middleware/authMiddleware.js";
import uploadMiddleware from "../config/cloudinary.js";
import {
  createPost,
  getFeed,
  getFriendsFeed,
  likePost,
  unlikePost,
  commentOnPost,
  updatePost,
  deletePost,
  deleteComment,
  getSinglePost,
  getUserPosts,
  getPinnedPosts,
} from "../controllers/postController.js";

const router = express.Router();

router.get("/pinned", protect, getPinnedPosts);
router.get("/feed", protect, getFeed);
router.get("/friends-feed", protect, getFriendsFeed);
router.get("/user/:userId", protect, getUserPosts);
router.get("/:id", protect, getSinglePost);
router.post("/", protect, uploadMiddleware.single("image"), createPost);
router.put("/:id/like", protect, likePost);
router.put("/:id/unlike", protect, unlikePost);
router.post("/:id/comment", protect, commentOnPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);
router.delete("/:postId/comment/:commentId", protect, deleteComment);

export default router;
