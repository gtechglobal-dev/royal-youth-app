import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema(
  {
    purpose: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Income", incomeSchema);
