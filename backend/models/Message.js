import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, maxlength: 2000 },
    imageUrl: { type: String, default: null },
    sharedPostId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    type: { type: String, enum: ["text", "call"], default: "text" },
    callType: { type: String, enum: ["audio", "video"] },
    callStatus: { type: String, enum: ["missed", "declined", "ended"] },
    callDuration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
