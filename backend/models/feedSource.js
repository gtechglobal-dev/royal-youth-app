import mongoose from "mongoose";

const feedSourceSchema = new mongoose.Schema({
  sourceId: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  label: { type: String, required: true },
  category: { type: String, required: true },
  icon: { type: String, default: "" },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("FeedSource", feedSourceSchema);
