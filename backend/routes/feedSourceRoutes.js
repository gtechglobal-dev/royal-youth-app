import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getFeedSources, toggleFeedSource } from "../controllers/feedSourceController.js";

const router = express.Router();

router.get("/", protect, getFeedSources);
router.patch("/:id/toggle", protect, toggleFeedSource);

export default router;
