import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getNotifications, markAsRead, deleteNotification, clearAllNotifications, sendAdminPushNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read", protect, markAsRead);
router.delete("/clear-all", protect, clearAllNotifications);
router.delete("/:id", protect, deleteNotification);
router.post("/admin-send", protect, (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "youth_president") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  next();
}, sendAdminPushNotification);

export default router;
