import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getVapidPublicKey, subscribe, unsubscribe, checkSubscription } from "../controllers/pushController.js";

const router = express.Router();

router.get("/vapid-public-key", protect, getVapidPublicKey);
router.get("/check", protect, checkSubscription);
router.post("/subscribe", protect, subscribe);
router.delete("/unsubscribe", protect, unsubscribe);

export default router;
