import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "firstname surname profileImage branch")
      .populate("lastSenderId", "firstname surname");

    const mapped = conversations.map((c) => {
      const other = c.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      );
      return {
        _id: c._id,
        otherUser: other || null,
        lastMessage: c.lastMessage,
        lastSenderId: c.lastSenderId,
        updatedAt: c.updatedAt,
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });

    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "firstname surname profileImage")
      .populate("sharedPostId");

    const total = await Message.countDocuments({ conversationId });

    res.json({
      messages: messages.reverse(),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + messages.length < total,
    });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, sharedPostId } = req.body;

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    if (!text && !req.file && !sharedPostId) {
      return res.status(400).json({ message: "Message text, image, or shared post is required" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, receiverId], $size: 2 },
    });

    const senderId = req.user._id;

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    let imageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      if (result) imageUrl = result.secure_url;
    }

    const messageText = (text || "").trim();

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      text: messageText,
      imageUrl,
      sharedPostId: sharedPostId || null,
    });

    conversation.lastMessage = messageText || (imageUrl ? "📷 Image" : "📎 Shared post");
    conversation.lastSenderId = senderId;
    await conversation.save();

    const populated = await Message.findById(message._id)
      .populate("senderId", "firstname surname profileImage")
      .populate("sharedPostId");

    if (receiverId.toString() !== senderId.toString()) {
      await Notification.create({
        userId: receiverId,
        fromUserId: senderId,
        type: "message",
        referenceId: conversation._id.toString(),
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot start conversation with yourself" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId], $size: 2 },
    }).populate("participants", "firstname surname profileImage branch");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
      });
      conversation = await conversation.populate("participants", "firstname surname profileImage branch");
    }

    const other = conversation.participants.find(
      (p) => p._id.toString() !== req.user._id.toString()
    );

    res.json({
      _id: conversation._id,
      otherUser: other || null,
    });
  } catch (err) {
    console.error("Get or create conversation error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
