import express from "express";
import protect from "../middleware/authMiddleware.js";
import { getMonthlyStats } from "../controllers/statsController.js";

const router = express.Router();

router.get("/monthly", protect, getMonthlyStats);

export default router;
