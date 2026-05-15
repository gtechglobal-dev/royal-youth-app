import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  sendRequest,
  acceptRequest,
  rejectRequest,
  removeFriend,
  getFriendRequests,
  getFriends,
  getSuggested,
  getFriendStatus,
} from "../controllers/friendController.js";

const router = express.Router();

router.get("/requests", protect, getFriendRequests);
router.get("/list", protect, getFriends);
router.get("/suggested", protect, getSuggested);
router.get("/status/:userId", protect, getFriendStatus);
router.post("/request", protect, sendRequest);
router.put("/accept/:id", protect, acceptRequest);
router.put("/reject/:id", protect, rejectRequest);
router.put("/remove", protect, removeFriend);

export default router;
