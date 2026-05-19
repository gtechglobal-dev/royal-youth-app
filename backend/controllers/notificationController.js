import Notification from "../models/Notification.js";
import PushSubscription from "../models/PushSubscription.js";
import User from "../models/user.js";
import Dues from "../models/dues.js";
import { sendPushNotification, sendPushToAllUsers } from "./pushController.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("fromUserId", "firstname surname profileImage");

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const executeAdminPush = async (title, body, target, createInAppNotifications, adminId, extra = {}) => {
  let sent = 0;
  let targetUsers = [];

  if (target === "subscribed") {
    sent = await sendPushToAllUsers(title, body, "/dashboard");
  } else if (target === "specific") {
    const userIds = extra.targetUserIds || [];
    if (userIds.length === 0) return { sent: 0, inAppCount: 0 };
    for (const uid of userIds) {
      try {
        await sendPushNotification(uid, title, body, "/dashboard");
        sent++;
      } catch (_) {}
    }
    targetUsers = userIds.map(id => ({ _id: id }));
  } else if (target === "unpaid") {
    const month = extra.duesMonth;
    const year = extra.duesYear || "2026";
    if (!month) return { sent: 0, inAppCount: 0 };
    const duesField = year === "2027" ? "dues2027" : "dues";
    const allUsers = await User.find({
      isDeleted: false,
      registrationStatus: "Approved",
      membershipStatus: "Active Member",
    }).select(`_id ${duesField}`);
    targetUsers = allUsers.filter(u => {
      const monthData = u[duesField]?.[month];
      return !monthData || monthData.status !== "Paid";
    });
    for (const user of targetUsers) {
      try {
        await sendPushNotification(user._id, title, body, "/dashboard");
        sent++;
      } catch (_) {}
    }
  } else {
    targetUsers = await User.find({
      isDeleted: false,
      registrationStatus: "Approved",
      membershipStatus: "Active Member",
    }).select("_id");
    for (const user of targetUsers) {
      try {
        await sendPushNotification(user._id, title, body, "/dashboard");
        sent++;
      } catch (_) {}
    }
  }

  let inAppCount = 0;
  if (createInAppNotifications && targetUsers.length > 0) {
    const notifications = targetUsers.map((u) => ({
      userId: u._id,
      fromUserId: adminId || "admin",
      type: "reminder",
      referenceId: "admin-broadcast",
    }));
    await Notification.insertMany(notifications);
    inAppCount = notifications.length;
  }

  if (createInAppNotifications && target === "subscribed") {
    const subs = await PushSubscription.find({});
    const notifications = subs.map((s) => ({
      userId: s.userId,
      fromUserId: adminId || "admin",
      type: "reminder",
      referenceId: "admin-broadcast",
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      inAppCount = notifications.length;
    }
  }

  return { sent, inAppCount };
};

const scheduledPushes = new Map();

const resolveAdminUserId = async (adminId) => {
  if (!adminId || adminId === "admin" || String(adminId).length < 10) {
    const adminUser = await User.findOne({ role: "admin", isDeleted: false }).select("_id").lean();
    if (adminUser) return adminUser._id;
    const anyUser = await User.findOne({ isDeleted: false }).select("_id").lean();
    return anyUser?._id || adminId;
  }
  return adminId;
};

export const sendAdminPushNotification = async (req, res) => {
  try {
    const { title, body, createInAppNotifications, target, scheduledAt, targetUserIds, duesMonth, duesYear } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    const adminId = await resolveAdminUserId(req.user?._id || "admin");
    const extra = { targetUserIds, duesMonth, duesYear };

    // If scheduledAt is provided and in the future, schedule it
    if (scheduledAt) {
      const sendTime = new Date(scheduledAt).getTime();
      const now = Date.now();
      if (sendTime > now) {
        const delay = sendTime - now;
        const timeoutId = setTimeout(async () => {
          const result = await executeAdminPush(title, body, target || "all", !!createInAppNotifications, adminId, extra);
          console.log(`📬 Scheduled push sent: "${title}" — ${result.sent} pushes, ${result.inAppCount} in-app`);
          scheduledPushes.delete(timeoutId);
        }, delay);

        scheduledPushes.set(timeoutId, { title, body, target, createInAppNotifications, scheduledAt, createdAt: new Date().toISOString(), extra });

        return res.json({
          message: "Push notification scheduled",
          scheduled: true,
          scheduledAt,
        });
      }
    }

    // Send immediately
    const result = await executeAdminPush(title, body, target || "all", !!createInAppNotifications, adminId, extra);

    console.log(`✅ Admin push: "${title}" — ${result.sent} pushes sent, ${result.inAppCount} in-app created`);

    res.json({
      message: "Push notification sent",
      pushSent: result.sent,
      inAppNotificationsCreated: result.inAppCount,
    });
  } catch (err) {
    console.error("❌ Send admin push error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
