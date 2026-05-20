import express from "express";
import protect from "../middleware/authMiddleware.js";
import uploadMiddleware from "../config/cloudinary.js";
import { getNotifications, markAsRead, markNotificationAsRead, deleteNotification, clearAllNotifications, sendAdminPushNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read", protect, markAsRead);
router.put("/read/:id", protect, markNotificationAsRead);
router.delete("/clear-all", protect, clearAllNotifications);
router.delete("/:id", protect, deleteNotification);
router.post("/admin-send", protect, uploadMiddleware.single("image"), (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "youth_president") {
    return res.status(403).json({ message: "Unauthorized: Admins only" });
  }
  next();
}, sendAdminPushNotification);

export default router;
