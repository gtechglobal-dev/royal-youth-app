import mongoose from "mongoose";

const duesSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    month: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid",
    },

    paymentDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Dues", duesSchema);
