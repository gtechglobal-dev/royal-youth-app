import express from "express";
import { clearAllData } from "../controllers/clearDataController.js";

const router = express.Router();

router.post("/clear-data", clearAllData);

export default router;