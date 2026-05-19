import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getExternalFeed } from "../controllers/feedController.js";

const router = express.Router();

router.get("/external", protect, getExternalFeed);

export default router;
