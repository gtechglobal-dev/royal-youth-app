import Post from "../models/Post.js";
import Notification from "../models/Notification.js";
import User from "../models/user.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";
import { getIO } from "../socket.js";
import { sendPushNotification } from "./pushController.js";

const resolveUserId = async (id) => {
  if (!id || id === "admin" || String(id).length < 10) {
    const adminUser = await User.findOne({ role: "admin", isDeleted: false }).select("_id").lean();
    if (adminUser) return adminUser._id;
    const anyUser = await User.findOne({ isDeleted: false }).select("_id").lean();
    return anyUser?._id || id;
  }
  return id;
};

export const createPost = async (req, res) => {
  try {
    const { text, placardColor } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Post text is required" });
    }

    let imageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      if (result) imageUrl = result.secure_url;
    }

    const post = await Post.create({
      userId: req.user._id,
      text: text.trim(),
      imageUrl,
      placardColor: placardColor || "#000000",
    });

    const populated = await Post.findById(post._id).populate("userId", "nickname firstname surname profileImage branch role");
    try { getIO().emit("newPost", populated.toObject()); } catch (e) {}
    res.status(201).json(populated);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "nickname firstname surname profileImage branch role")
      .populate("comments.userId", "nickname firstname surname profileImage")
      .populate("comments.replies.userId", "nickname firstname surname profileImage");

    const total = await Post.countDocuments({ isDeleted: false });

    res.json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    });
  } catch (err) {
    console.error("Get feed error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user._id;
    if (post.likes.some((id) => id.toString() === userId.toString())) {
      return res.status(400).json({ message: "Already liked" });
    }

    post.likes.push(userId);
    await post.save();

    if (post.userId.toString() !== userId.toString()) {
      const fromId = await resolveUserId(userId);
      const targetId = post.userId.toString().length < 10 ? await resolveUserId(post.userId) : post.userId;
      const notif = await Notification.create({
        userId: targetId,
        fromUserId: fromId,
        type: "like",
        referenceId: post._id.toString(),
      });
      try { getIO().to(`user:${targetId}`).emit("newNotification", {}); } catch (e) {}
      try { sendPushNotification(targetId, "Royal Youth Hub", `${req.user.firstname || "Admin"} liked your post`, "/community", notif._id.toString()); } catch (e) {}
    }

    try { getIO().emit("postLiked", { postId: post._id.toString(), userId: userId.toString(), likeCount: post.likes.length }); } catch (e) {}
    res.json({ likes: post.likes, likeCount: post.likes.length });
  } catch (err) {
    console.error("Like post error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPostLikes = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "likes",
      "nickname firstname surname profileImage"
    );
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post.likes);
  } catch (err) {
    console.error("Get post likes error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user._id;
    const index = post.likes.findIndex((id) => id.toString() === userId.toString());
    if (index === -1) {
      return res.status(400).json({ message: "Not liked yet" });
    }

    post.likes.splice(index, 1);
    await post.save();

    try { getIO().emit("postUnliked", { postId: post._id.toString(), userId: userId.toString(), likeCount: post.likes.length }); } catch (e) {}
    res.json({ likes: post.likes, likeCount: post.likes.length });
  } catch (err) {
    console.error("Unlike post error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = {
      userId: req.user._id,
      text: text.trim(),
    };

    post.comments.push(comment);
    await post.save();

    const savedComment = post.comments[post.comments.length - 1];
    const populated = await Post.findById(post._id)
      .populate("comments.userId", "nickname firstname surname profileImage")
      .populate("comments.replies.userId", "nickname firstname surname profileImage");

    const addedComment = populated.comments.find(
      (c) => c._id.toString() === savedComment._id.toString()
    );

    if (post.userId.toString() !== req.user._id.toString()) {
      const fromId = await resolveUserId(req.user._id);
      const targetId = post.userId.toString().length < 10 ? await resolveUserId(post.userId) : post.userId;
      const notif = await Notification.create({
        userId: targetId,
        fromUserId: fromId,
        type: "comment",
        referenceId: post._id.toString(),
      });
      try { getIO().to(`user:${targetId}`).emit("newNotification", {}); } catch (e) {}
      try { sendPushNotification(targetId, "Royal Youth Hub", `${req.user.firstname || "Admin"} commented: ${text.trim().slice(0, 50)}`, `/post/${post._id}`, notif._id.toString()); } catch (e) {}
    }

    try { getIO().emit("newComment", { postId: post._id.toString(), comment: addedComment.toObject() }); } catch (e) {}
    res.status(201).json(addedComment);
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { text, placardColor } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Post text is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    post.text = text.trim();
    if (placardColor) post.placardColor = placardColor;
    await post.save();

     const populated = await Post.findById(post._id)
       .populate("userId", "nickname firstname surname profileImage branch role")
       .populate("comments.userId", "nickname firstname surname profileImage")
      .populate("comments.replies.userId", "nickname firstname surname profileImage");

     try { getIO().emit("postUpdated", populated.toObject()); } catch (e) {}
     res.json(populated);
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await deleteFromCloudinary(post.imageUrl);
    post.isDeleted = true;
    await post.save();

    try { getIO().emit("postDeleted", { postId: post._id.toString() }); } catch (e) {}
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const likeComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || post.isDeleted) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const userId = req.user._id;
    const idx = comment.likes.findIndex((id) => id.toString() === userId.toString());
    if (idx !== -1) return res.status(400).json({ message: "Already liked" });

    comment.likes.push(userId);
    await post.save();

    res.json({ likes: comment.likes, likeCount: comment.likes.length });
  } catch (err) {
    console.error("Like comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const unlikeComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || post.isDeleted) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const userId = req.user._id;
    const idx = comment.likes.findIndex((id) => id.toString() === userId.toString());
    if (idx === -1) return res.status(400).json({ message: "Not liked yet" });

    comment.likes.splice(idx, 1);
    await post.save();

    res.json({ likes: comment.likes, likeCount: comment.likes.length });
  } catch (err) {
    console.error("Unlike comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const replyToComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: "Reply text is required" });

    const post = await Post.findById(req.params.postId);
    if (!post || post.isDeleted) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const reply = { userId: req.user._id, text: text.trim() };
    comment.replies.push(reply);
    await post.save();

    const savedReply = comment.replies[comment.replies.length - 1];
    const populated = await Post.findById(post._id)
      .populate("comments.userId", "nickname firstname surname profileImage")
      .populate("comments.replies.userId", "nickname firstname surname profileImage");

    const populatedComment = populated.comments.id(comment._id);
    const addedReply = populatedComment.replies.id(savedReply._id);

    res.status(201).json({ reply: addedReply, commentId: comment._id.toString() });
  } catch (err) {
    console.error("Reply to comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.deleteOne();
    await post.save();

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFriendsFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id);
    const friendIds = (user.friends || []).map((f) => f.toString());
    friendIds.push(req.user._id.toString());

    const posts = await Post.find({ isDeleted: false, userId: { $in: friendIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "nickname firstname surname profileImage branch role")
      .populate("comments.userId", "nickname firstname surname profileImage")
      .populate("comments.replies.userId", "nickname firstname surname profileImage");

    const total = await Post.countDocuments({ isDeleted: false, userId: { $in: friendIds } });

    res.json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    });
  } catch (err) {
    console.error("Get friends feed error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSinglePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("userId", "nickname firstname surname profileImage branch role")
      .populate("comments.userId", "nickname firstname surname profileImage")
      .populate("comments.replies.userId", "nickname firstname surname profileImage");

    if (!post || post.isDeleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error("Get post error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "nickname firstname surname profileImage branch role")
      .populate("comments.userId", "nickname firstname surname profileImage")
      .populate("comments.replies.userId", "nickname firstname surname profileImage");

    res.json({ posts });
  } catch (err) {
    console.error("Get user posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPinnedPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      isPinned: true,
      isDeleted: false,
    })
      .sort({ pinnedAt: -1 })
      .populate("userId", "nickname firstname surname profileImage branch role")
      .populate("comments.userId", "nickname firstname surname profileImage")
      .populate("comments.replies.userId", "nickname firstname surname profileImage");

    res.json({ posts });
  } catch (err) {
    console.error("Get pinned posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPastAnnouncements = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "youth_president") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const posts = await Post.find({
      isPinned: false,
      pinnedAt: { $ne: null },
      isDeleted: false,
    })
      .sort({ pinnedAt: -1 })
      .populate("userId", "nickname firstname surname profileImage branch role")
      .populate("comments.userId", "nickname firstname surname profileImage")
      .populate("comments.replies.userId", "nickname firstname surname profileImage");

    res.json({ posts });
  } catch (err) {
    console.error("Get past announcements error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "youth_president") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { text, authorUserId, placardColor } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Announcement text is required" });
    }

    let author;
    if (authorUserId && authorUserId !== "auto_admin" && authorUserId !== "auto_youth_president") {
      author = await User.findById(authorUserId).select("-password");
    } else {
      const targetRole = authorUserId === "auto_admin" ? "admin" : "youth_president";
      if (req.user.role === targetRole) {
        author = req.user;
        if (author._id === "admin") {
          author = await User.findOne({ role: "admin", isDeleted: false }).select("-password");
        }
      } else {
        author = await User.findOne({ role: targetRole, isDeleted: false, registrationStatus: "Approved" }).select("-password");
      }
    }

    if (!author) {
      return res.status(404).json({ message: "No user found for announcement author" });
    }

    let imageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      if (result) imageUrl = result.secure_url;
    }

    const post = await Post.create({
      userId: author._id,
      text: text.trim(),
      imageUrl,
      placardColor: placardColor || "#000000",
      isPinned: true,
      pinnedAt: new Date(),
    });

     const populated = await Post.findById(post._id).populate("userId", "nickname firstname surname profileImage branch role");
     try { getIO().emit("newAnnouncement", populated.toObject()); } catch (e) {}
     try { getIO().emit("newPost", populated.toObject()); } catch (e) {}
     res.status(201).json(populated);
  } catch (err) {
    console.error("Create announcement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "youth_president") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { text, placardColor } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Announcement text is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Announcement not found" });
    if (!post.pinnedAt) return res.status(400).json({ message: "Not an announcement" });

    post.text = text.trim();
    if (placardColor) post.placardColor = placardColor;

    if (req.file) {
      await deleteFromCloudinary(post.imageUrl);
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      if (result) post.imageUrl = result.secure_url;
    }

    await post.save();

     const populated = await Post.findById(post._id)
       .populate("userId", "nickname firstname surname profileImage branch role");

     try { getIO().emit("announcementUpdated", populated.toObject()); } catch (e) {}
     try { getIO().emit("postUpdated", populated.toObject()); } catch (e) {}
     res.json(populated);
  } catch (err) {
    console.error("Update announcement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const repostAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "youth_president") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Announcement not found" });
    if (!post.pinnedAt) return res.status(400).json({ message: "Not an announcement" });
    if (post.isPinned) return res.status(400).json({ message: "Already pinned" });

    post.isPinned = true;
    post.pinnedAt = new Date();

    await post.save();

     const populated = await Post.findById(post._id)
       .populate("userId", "nickname firstname surname profileImage branch role");

     try { getIO().emit("newAnnouncement", populated.toObject()); } catch (e) {}
     try { getIO().emit("postUpdated", populated.toObject()); } catch (e) {}
     res.json(populated);
  } catch (err) {
    console.error("Repost announcement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "youth_president") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Announcement not found" });
    if (!post.pinnedAt) return res.status(400).json({ message: "Not an announcement" });

     await deleteFromCloudinary(post.imageUrl);
     post.isDeleted = true;
     await post.save();
 
     try { getIO().emit("announcementDeleted", { postId: post._id.toString() }); } catch (e) {}
     try { getIO().emit("postDeleted", { postId: post._id.toString() }); } catch (e) {}
     res.json({ message: "Announcement deleted" });
  } catch (err) {
    console.error("Delete announcement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const unpinAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "youth_president") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Announcement not found" });
    if (!post.isPinned) return res.status(400).json({ message: "Not an announcement" });

    post.isPinned = false;

    await post.save();

     const populated = await Post.findById(post._id)
       .populate("userId", "nickname firstname surname profileImage branch role");

     try { getIO().emit("announcementUnpinned", populated.toObject()); } catch (e) {}
     try { getIO().emit("postUnpinned", populated.toObject()); } catch (e) {}
     res.json(populated);
  } catch (err) {
    console.error("Unpin announcement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
