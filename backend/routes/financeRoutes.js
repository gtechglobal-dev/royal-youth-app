import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  addIncome,
  addExpense,
  getBalanceSheet,
  getAllIncome,
  getAllExpenses,
  resetFinanceData,
  updateIncome,
  deleteIncome,
} from "../controllers/financeController.js";

const router = express.Router();

router.post("/income", protect, addIncome);

router.put("/income/:id", protect, updateIncome);

router.delete("/income/:id", protect, deleteIncome);

router.post("/expense", protect, addExpense);

router.get("/balance-sheet", protect, getBalanceSheet);

router.get("/income/all", protect, getAllIncome);

router.get("/expense/all", protect, getAllExpenses);

router.post("/reset", protect, resetFinanceData);

export default router;
