import Dues from "../models/dues.js";
import Notification from "../models/Notification.js";
import { getIO } from "../socket.js";
import { sendPushNotification } from "./pushController.js";

const resolveUserId = async (id) => {
  if (!id || id === "admin" || String(id).length < 10) {
    const { default: User } = await import("../models/user.js");
    const adminUser = await User.findOne({ role: "admin", isDeleted: false }).select("_id").lean();
    if (adminUser) return adminUser._id;
    const anyUser = await User.findOne({ isDeleted: false }).select("_id").lean();
    return anyUser?._id || id;
  }
  return id;
};

// ADMIN MARK DUES

export const markDues = async (req, res) => {
  try {
    const { userId, month, amount, status } = req.body;

    let record = await Dues.findOne({ user: userId, month });

    if (record) {
      record.amount = amount;
      record.status = status;
      record.paymentDate = new Date();

      await record.save();
    } else {
      record = new Dues({
        user: userId,
        month,
        amount,
        status,
        paymentDate: new Date(),
      });

      await record.save();
    }

    if (status === "Paid") {
      const fromId = await resolveUserId(req.user?._id || "admin");
      const targetId = String(userId).length < 10 ? await resolveUserId(userId) : userId;
      const notif = await Notification.create({
        userId: targetId,
        fromUserId: fromId,
        type: "reminder",
        referenceId: `${month} Dues`,
        body: `Your dues for ${month} have been marked as paid`,
      });
      try { getIO().to(`user:${targetId}`).emit("newNotification", {}); } catch (e) {}
      try { sendPushNotification(targetId, "Royal Youth Hub", `Your ${month} dues have been marked as paid`, "/dashboard", notif._id.toString()); } catch (e) {}
    }

    res.json({ message: "Dues updated successfully", record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// MEMBER VIEW THEIR DUES

export const getUserDues = async (req, res) => {
  try {
    const dues = await Dues.find({ user: req.user._id });

    res.json(dues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
