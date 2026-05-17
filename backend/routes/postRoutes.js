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
  getPastAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  unpinAnnouncement,
  repostAnnouncement,
} from "../controllers/postController.js";

const router = express.Router();

router.get("/pinned", protect, getPinnedPosts);
router.get("/announcements/past", protect, getPastAnnouncements);
router.post("/announcement", protect, uploadMiddleware.single("image"), createAnnouncement);
router.put("/announcement/unpin/:id", protect, unpinAnnouncement);
router.put("/announcement/repost/:id", protect, repostAnnouncement);
router.put("/announcement/:id", protect, uploadMiddleware.single("image"), updateAnnouncement);
router.delete("/announcement/:id", protect, deleteAnnouncement);
router.get("/feed", protect, getFeed);
router.get("/friends-feed", protect, getFriendsFeed);
router.get("/user/:userId", protect, getUserPosts);
router.get("/public/:id", getSinglePost);
router.get("/:id", protect, getSinglePost);
router.post("/", protect, uploadMiddleware.single("image"), createPost);
router.put("/:id/like", protect, likePost);
router.put("/:id/unlike", protect, unlikePost);
router.post("/:id/comment", protect, commentOnPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);
router.delete("/:postId/comment/:commentId", protect, deleteComment);

export default router;
