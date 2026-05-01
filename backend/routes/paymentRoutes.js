import express from "express";
import { getDuesIncome, getAllSpecialDonations, getSpecialPayments, addSpecialDonation } from "../controllers/paymentController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Online payment routes disabled - working with offline payments only for now
// router.post("/initialize", protect, initializePayment);
// router.post("/verify", protect, verifyPayment);
// router.post("/webhook", handlePaystackWebhook);
// router.post("/special-initialize", protect, initializeSpecialPayment);
// router.post("/special-verify", protect, verifySpecialPayment);

router.get("/income", protect, getDuesIncome);
router.get("/all-special-donations", protect, getAllSpecialDonations);
router.get("/special-payments", protect, getSpecialPayments);
router.post("/add-special-donation", protect, addSpecialDonation);

export default router;
