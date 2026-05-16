import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    imageUrl: { type: String, default: null },
    placardColor: { type: String, default: "#000000" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    isDeleted: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    pinnedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

export default mongoose.model("Post", postSchema);
