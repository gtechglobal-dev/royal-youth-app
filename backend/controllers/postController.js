import Post from "../models/Post.js";
import Notification from "../models/Notification.js";
import User from "../models/user.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

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

    const populated = await Post.findById(post._id).populate("userId", "firstname surname profileImage branch");
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
      .populate("userId", "firstname surname profileImage branch")
      .populate("comments.userId", "firstname surname profileImage");

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
      await Notification.create({
        userId: post.userId,
        fromUserId: userId,
        type: "like",
        referenceId: post._id.toString(),
      });
    }

    res.json({ likes: post.likes, likeCount: post.likes.length });
  } catch (err) {
    console.error("Like post error:", err);
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
      .populate("comments.userId", "firstname surname profileImage");

    const addedComment = populated.comments.find(
      (c) => c._id.toString() === savedComment._id.toString()
    );

    if (post.userId.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: post.userId,
        fromUserId: req.user._id,
        type: "comment",
        referenceId: post._id.toString(),
      });
    }

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
      .populate("userId", "firstname surname profileImage branch")
      .populate("comments.userId", "firstname surname profileImage");

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

    post.isDeleted = true;
    await post.save();

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Delete post error:", err);
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
      .populate("userId", "firstname surname profileImage branch")
      .populate("comments.userId", "firstname surname profileImage");

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
      .populate("userId", "firstname surname profileImage branch")
      .populate("comments.userId", "firstname surname profileImage");

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
      .populate("userId", "firstname surname profileImage branch")
      .populate("comments.userId", "firstname surname profileImage");

    res.json({ posts });
  } catch (err) {
    console.error("Get user posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPinnedPosts = async (req, res) => {
  try {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS);

    const posts = await Post.find({
      isPinned: true,
      pinnedAt: { $gte: cutoff },
      isDeleted: false,
    })
      .sort({ pinnedAt: -1 })
      .populate("userId", "firstname surname profileImage branch")
      .populate("comments.userId", "firstname surname profileImage");

    res.json({ posts });
  } catch (err) {
    console.error("Get pinned posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const resolveAdminUser = async () => {
  let adminUser = await User.findOne({ role: "admin", isDeleted: false }).select("-password");
  if (!adminUser) {
    const bcrypt = (await import("bcryptjs")).default;
    adminUser = await User.create({
      firstname: "Royal",
      surname: "Youth Admin",
      email: "admin@royalyouths.com",
      phone: "0000000000",
      password: await bcrypt.hash("admin-autogenerated-" + Date.now(), 10),
      role: "admin",
      registrationStatus: "Approved",
      isVerified: true,
    });
    adminUser = await User.findById(adminUser._id).select("-password");
  }
  return adminUser;
};

export const createAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "youth_president") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Announcement text is required" });
    }

    let userId = req.user._id;
    if (req.user._id === "admin") {
      const adminUser = await resolveAdminUser();
      userId = adminUser._id;
    }

    let imageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      if (result) imageUrl = result.secure_url;
    }

    const post = await Post.create({
      userId,
      text: text.trim(),
      imageUrl,
      isPinned: true,
      pinnedAt: new Date(),
    });

    const populated = await Post.findById(post._id).populate("userId", "firstname surname profileImage branch");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Create announcement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
