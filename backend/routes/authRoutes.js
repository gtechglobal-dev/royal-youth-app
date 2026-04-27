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
} from "../controllers/authController.js";
import upload from "../config/cloudinary.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

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
    const userModel = await import("../models/user.js").then(m => m.default);
    const { sendApprovalEmail } = await import("../utils/emailSender.js");
    const member = await userModel.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    member.registrationStatus = "Approved";
    await member.save();
    if (member.email) {
      await sendApprovalEmail(member.email, member.firstname);
    }
    res.json({ message: "Member approved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/reject-member/:id", protect, async (req, res) => {
  try {
    const userModel = await import("../models/user.js").then(m => m.default);
    const { sendRejectionEmail } = await import("../utils/emailSender.js");
    const member = await userModel.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    member.registrationStatus = "Rejected";
    await member.save();
    if (member.email) {
      await sendRejectionEmail(member.email, member.firstname);
    }
    res.json({ message: "Member rejected" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/pending", protect, async (req, res) => {
  try {
    const user = await import("../models/user.js").then(m => m.default);
    const pending = await user.find({ registrationStatus: "Pending" }).select("-password");
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
