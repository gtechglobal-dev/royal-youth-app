import express from "express";
import protect from "../middleware/authMiddleware.js";
import uploadMiddleware from "../config/cloudinary.js";
import {
  getConversations,
  getMessages,
  sendMessage,
  getOrCreateConversation,
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/conversations", protect, getConversations);
router.get("/conversation/:userId", protect, getOrCreateConversation);
router.get("/:conversationId", protect, getMessages);
router.post("/send", protect, uploadMiddleware.single("image"), sendMessage);

export default router;
