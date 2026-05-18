import express from "express";
import { sendDuesReminders } from "../controllers/reminderController.js";

const router = express.Router();

router.get("/send-dues-reminder", (req, res, next) => {
  const key = req.query.key || req.headers["x-api-key"];
  if (!key || key !== process.env.REMINDER_API_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}, sendDuesReminders);

export default router;
