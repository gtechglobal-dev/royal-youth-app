import express from "express";
import { clearAllData } from "../controllers/clearDataController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/clear-data", protect, clearAllData);

export default router;
