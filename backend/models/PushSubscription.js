import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

pushSubscriptionSchema.index({ userId: 1 });

export default mongoose.model("PushSubscription", pushSubscriptionSchema);
