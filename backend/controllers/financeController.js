import Income from "../models/income.js";
import Expense from "../models/expense.js";
import User from "../models/user.js";

// RESET FINANCE DATA
export const resetFinanceData = async (req, res) => {
  try {
    await Income.deleteMany({});
    await Expense.deleteMany({});

    res.json({ message: "Finance data reset successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADD INCOME (Other income only - NOT member donations)
export const addIncome = async (req, res) => {
  try {
    const { purpose, amount, date } = req.body;

    const income = new Income({
      purpose,
      amount,
      date,
    });

    await income.save();

    res.json({ message: "Income added", income });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADD EXPENSE
export const addExpense = async (req, res) => {
  try {
    const { purpose, amount, date } = req.body;

    const expense = new Expense({
      purpose,
      amount,
      date,
    });

    await expense.save();

    res.json({ message: "Expense added", expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET BALANCE SHEET
export const getBalanceSheet = async (req, res) => {
  try {
    const members = await User.find();

    let totalDues = 0;
    const months2026 = ["April", "May", "June", "July", "August", "September", "October", "November", "December"];

    months2026.forEach(month => {
      members.forEach(member => {
        if (member.dues[month]?.status === "Paid") {
          totalDues += Number(member.dues[month].amount || 2000);
        }
      });
    });

    // Get OTHER income only (NO memberId)
    const otherIncome = await Income.find({
      memberId: { $exists: false }
    });
    const totalOtherIncome = otherIncome.reduce((sum, inc) => sum + inc.amount, 0);

    // Get expenses
    const expenses = await Expense.find();
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.status(200).json({
      totalDues,
      totalOtherIncome,
      totalExpenses,
      balance: totalDues + totalOtherIncome - totalExpenses,
    });
  } catch (error) {
    console.error("Error getting balance sheet:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET ALL INCOME (Other income ONLY - NO member donations, NO dues)
export const getAllIncome = async (req, res) => {
  try {
    // Only get income WITHOUT memberId AND exclude any dues payments by purpose
    const incomes = await Income.find({
      memberId: { $exists: false },
      purpose: { $not: /2026 Dues|Dues -/ }
    }).sort({ date: -1 });

    res.status(200).json(incomes);
  } catch (error) {
    console.error("Error getting all income:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET ALL EXPENSES
export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    console.error("Error getting all expenses:", error);
    res.status(500).json({ error: error.message });
  }
};
