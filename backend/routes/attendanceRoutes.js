import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  markAttendance,
  getUserAttendance,
  getAllAttendance,
  createMeeting,
  getAllMeetings,
  deleteMeeting,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/meeting", protect, createMeeting);

router.get("/meetings", protect, getAllMeetings);

router.delete("/meeting/:id", protect, deleteMeeting);

router.post("/mark", protect, markAttendance);

router.get("/my-attendance", protect, getUserAttendance);

router.get("/all", protect, getAllAttendance);

export default router;
