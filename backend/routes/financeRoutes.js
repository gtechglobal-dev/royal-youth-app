import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  addIncome,
  addExpense,
  getBalanceSheet,
  resetFinanceData,
} from "../controllers/financeController.js";

const router = express.Router();

router.post("/income", protect, addIncome);

router.post("/expense", protect, addExpense);

router.get("/balance-sheet", protect, getBalanceSheet);

router.post("/reset", protect, resetFinanceData);

export default router;
