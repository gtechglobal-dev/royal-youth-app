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

export default router;
