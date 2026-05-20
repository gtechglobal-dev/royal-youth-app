import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getExternalFeed, getAvailableSources, followSource, unfollowSource } from "../controllers/feedController.js";

const router = express.Router();

router.get("/external", protect, getExternalFeed);
router.get("/available", protect, getAvailableSources);
router.post("/follow/:sourceId", protect, followSource);
router.delete("/follow/:sourceId", protect, unfollowSource);

export default router;
