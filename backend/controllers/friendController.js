import FriendRequest from "../models/FriendRequest.js";
import User from "../models/user.js";
import { getIO } from "../socket.js";

export const sendRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot friend yourself" });
    }

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: "User not found" });

    const existing = await FriendRequest.findOne({
      $or: [
        { from: req.user._id, to: userId },
        { from: userId, to: req.user._id },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") return res.status(400).json({ message: "Already friends" });
      if (existing.status === "pending") return res.status(400).json({ message: "Request already sent" });
      existing.status = "pending";
      existing.from = req.user._id;
      existing.to = userId;
      await existing.save();
      try { getIO().to(`user:${userId}`).emit("friendRequestUpdate", {}); } catch (e) {}
      return res.json({ message: "Friend request sent" });
    }

    await FriendRequest.create({ from: req.user._id, to: userId });
    try { getIO().to(`user:${userId}`).emit("friendRequestUpdate", {}); } catch (e) {}
    res.json({ message: "Friend request sent" });
  } catch (err) {
    console.error("Send request error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (request.status !== "pending") return res.status(400).json({ message: "Request already handled" });

    request.status = "accepted";
    await request.save();

    await User.findByIdAndUpdate(request.from, { $addToSet: { friends: request.to } });
    await User.findByIdAndUpdate(request.to, { $addToSet: { friends: request.from } });

    try { getIO().to(`user:${request.from}`).emit("friendRequestUpdate", {}); } catch (e) {}
    try { getIO().to(`user:${request.to}`).emit("friendRequestUpdate", {}); } catch (e) {}
    res.json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("Accept error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    request.status = "rejected";
    await request.save();
    try { getIO().to(`user:${request.from}`).emit("friendRequestUpdate", {}); } catch (e) {}
    res.json({ message: "Friend request rejected" });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const { userId } = req.body;
    await User.findByIdAndUpdate(req.user._id, { $pull: { friends: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { friends: req.user._id } });
    await FriendRequest.deleteOne({
      $or: [
        { from: req.user._id, to: userId },
        { from: userId, to: req.user._id },
      ],
    });
    res.json({ message: "Friend removed" });
  } catch (err) {
    console.error("Remove error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({ to: req.user._id, status: "pending" })
      .populate("from", "firstname surname profileImage branch")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("friends", "firstname surname profileImage branch");
    res.json(user.friends || []);
  } catch (err) {
    console.error("Get friends error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSuggested = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const friendIds = (user.friends || []).map((f) => f.toString());
    friendIds.push(req.user._id.toString());

    const pending = await FriendRequest.find({
      $or: [{ from: req.user._id }, { to: req.user._id }],
      status: "pending",
    });

    const statusMap = {};
    pending.forEach((r) => {
      const fromId = r.from.toString();
      const toId = r.to.toString();
      const myId = req.user._id.toString();

      if (fromId === myId) {
        statusMap[toId] = { status: "pending_sent" };
      } else if (toId === myId) {
        statusMap[fromId] = { status: "pending_received", requestId: r._id };
      }
    });

    const suggested = await User.find({
      _id: { $nin: friendIds },
      registrationStatus: "Approved",
      isDeleted: false,
    })
      .select("firstname surname profileImage branch occupation role")
      .limit(20);

    const enriched = suggested.map((s) => {
      const obj = s.toObject();
      const idStr = obj._id.toString();
      if (statusMap[idStr]) {
        obj.friendStatus = statusMap[idStr].status;
        if (statusMap[idStr].requestId) {
          obj.requestId = statusMap[idStr].requestId;
        }
      } else {
        obj.friendStatus = "none";
      }
      return obj;
    });

    res.json(enriched);
  } catch (err) {
    console.error("Get suggested error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFriendStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if ((user.friends || []).some((f) => f.toString() === userId)) {
      return res.json({ status: "friends" });
    }

    const request = await FriendRequest.findOne({
      $or: [
        { from: req.user._id, to: userId },
        { from: userId, to: req.user._id },
      ],
    });

    if (request) {
      if (request.status === "pending") {
        const sentByMe = request.from.toString() === req.user._id.toString();
        return res.json({ status: sentByMe ? "requested" : "received", requestId: request._id });
      }
      if (request.status === "rejected") return res.json({ status: "none" });
    }

    res.json({ status: "none" });
  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
