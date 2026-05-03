import mongoose from "mongoose";

const meetingResponseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  meetingTitle: {
    type: String,
    required: true
  },
  response: {
    type: String,
    enum: ["I will be there", "I will try my best", "I wont be able to make it", "I am so busy"],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("MeetingResponse", meetingResponseSchema);
