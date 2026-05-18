import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.js";

const vapidKeys = webpush.generateVAPIDKeys();

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:royalyouthsc4c5@gmail.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
} else {
  webpush.setVapidDetails(
    "mailto:royalyouthsc4c5@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const getVapidPublicKey = (req, res) => {
  res.json({
    publicKey: process.env.VAPID_PUBLIC_KEY || vapidKeys.publicKey,
  });
};

export const subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: "Invalid subscription" });
    }

    await PushSubscription.findOneAndUpdate(
      { userId: req.user._id },
      { userId: req.user._id, endpoint, keys },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: "Subscribed" });
  } catch (err) {
    console.error("Subscribe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    await PushSubscription.findOneAndDelete({ userId: req.user._id });
    res.json({ message: "Unsubscribed" });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendPushNotification = async (userId, title, body, url) => {
  try {
    const sub = await PushSubscription.findOne({ userId });
    if (!sub) return;

    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify({ title, body, url })
    );
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await PushSubscription.findOneAndDelete({ userId });
    }
  }
};
