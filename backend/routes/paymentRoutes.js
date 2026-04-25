import express from "express";
import { initializePayment, verifyPayment, handlePaystackWebhook, getDuesIncome, initializeSpecialPayment, verifySpecialPayment, getSpecialPayments } from "../controllers/paymentController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/initialize", protect, initializePayment);
router.post("/verify", protect, verifyPayment);
router.post("/webhook", handlePaystackWebhook);
router.get("/income", protect, getDuesIncome);
router.post("/special-initialize", protect, initializeSpecialPayment);
router.post("/special-verify", protect, verifySpecialPayment);
router.get("/special-payments", protect, getSpecialPayments);

export default router;