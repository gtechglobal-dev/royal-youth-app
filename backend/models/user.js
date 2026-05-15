import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    surname: {
      type: String,
      required: true,
    },

    firstname: {
      type: String,
      required: true,
    },

    othername: {
      type: String,
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    address: {
      type: String,
    },

    stateOfOrigin: {
      type: String,
    },

    lga: {
      type: String,
    },

    branch: {
      type: String,
      default: "Plot C4/C5 Owerri",
    },

    occupation: {
      type: String,
      required: true,
    },

    soulwinnersBranch: {
      type: String,
    },

    hobbies: {
      type: [String],
    },

    serviceUnit: {
      type: String,
    },

    serviceUnitLove: {
      type: String,
    },

    bornAgain: {
      type: String,
      enum: ["Yes", "No", "Not sure"],
      required: true,
    },

    profileImage: {
      type: String,
    },

    password: {
      type: String,
      required: true,
    },

    membershipStatus: {
      type: String,
      enum: ["Active Member", "Inactive Member"],
      default: "Inactive Member",
    },

    lastLogin: {
      type: Date,
    },

    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationToken: {
      type: String,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    registrationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    dues: {
      January: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      February: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      March: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      April: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      May: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      June: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      July: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      August: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      September: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      October: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      November: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      December: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
    },

    dues2027: {
      January: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      February: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      March: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      April: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      May: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      June: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      July: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      August: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      September: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      October: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      November: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
      December: {
        status: { type: String, default: "Unpaid" },
        amount: { type: Number, default: 0 },
        date: { type: Date, default: null },
      },
    },

    specialDonations: [{
      purpose: { type: String, required: true },
      amount: { type: Number, required: true },
      date: { type: Date, default: null },
      status: { type: String, default: "Paid" },
    }],

    resetPasswordOTP: {
      type: String,
      default: null,
    },
    resetPasswordExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
