import express from "express";
import {
  registerUser,
  loginUser,
  getAllMembers,
  getSingleMember,
  updateMembershipStatus,
  updateDues,
  adminLogin,
  verifyEmail,
  getCurrentUser,
  deleteMember,
  getMemberDues,
  updateProfile,
  uploadProfileImage,
} from "../controllers/authController.js";
import upload from "../config/cloudinary.js";
import protect from "../middleware/authMiddleware.js";
import User from "../models/user.js";
import { sendApprovalEmail, sendRejectionEmail, sendOTPEmail } from "../utils/emailSender.js";

const router = express.Router();

router.post("/upload-image", upload.single("profileImage"), uploadProfileImage);

router.post("/register", upload.single("profileImage"), registerUser);

router.post("/login", loginUser);

router.post("/admin-login", adminLogin);

router.get("/verify/:token", verifyEmail);

router.get("/me", protect, getCurrentUser);

router.get("/members", protect, getAllMembers);

router.get("/member/:id", protect, getSingleMember);

router.get("/member-dues/:id", protect, getMemberDues);

router.put("/member-status/:id", protect, updateMembershipStatus);

router.put("/dues/:id", protect, updateDues);

router.delete("/member/:id", protect, deleteMember);

router.put("/profile", protect, upload.single("profileImage"), updateProfile);

router.put("/approve-member/:id", protect, async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    member.registrationStatus = "Approved";
    await member.save();
    if (member.email) {
      try {
        await sendApprovalEmail(member.email, member.firstname);
      } catch (emailErr) {
        console.error("Failed to send approval email:", emailErr);
      }
    }
    res.json({ message: "Member Approved successfully" });
  } catch (err) {
    console.error("Approve member error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/reject-member/:id", protect, async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    member.registrationStatus = "Rejected";
    await member.save();
    if (member.email) {
      try {
        await sendRejectionEmail(member.email, member.firstname);
      } catch (emailErr) {
        console.error("Failed to send rejection email:", emailErr);
      }
    }
    res.json({ message: "Member rejected" });
  } catch (err) {
    console.error("Reject member error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/pending", protect, async (req, res) => {
  try {
    const pending = await User.find({ registrationStatus: "Pending" }).select("-password");
    res.json(pending);
  } catch (err) {
    console.error("Fetch pending members error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    
    console.log("Forgot password request for:", email);
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (!user) return res.status(404).json({ message: "User not found with this email" });
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP:", otp, "for user:", user.firstname);
    user.resetPasswordOTP = otp;
    user.resetPasswordExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    console.log("OTP saved to database");
    
    try {
      console.log("Attempting to send OTP email...");
      await sendOTPEmail(user.email, user.firstname, otp);
      console.log("OTP email sent successfully");
    } catch (emailErr) {
      console.error("Failed to send OTP email:", emailErr);
    }
    res.json({ message: "OTP sent to your email. Please check your inbox and spam folder." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and new password are required" });
    }
    
    const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (!user.resetPasswordExpiry || new Date() > user.resetPasswordExpiry) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    
    const bcrypt = await import("bcryptjs");
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOTP = null;
    user.resetPasswordExpiry = null;
    await user.save();
    
    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
