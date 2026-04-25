import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  markAttendance,
  getUserAttendance,
  createMeeting,
  getAllMeetings,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/meeting", protect, createMeeting);

router.get("/meetings", protect, getAllMeetings);

router.post("/mark", protect, markAttendance);

router.get("/my-attendance", protect, getUserAttendance);

export default router;
