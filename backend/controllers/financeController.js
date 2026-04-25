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

// ADD INCOME
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
        if (member.dues[month]?.status === "Paid" && member.dues[month]?.amount > 0) {
          totalDues += Number(member.dues[month].amount);
        }
      });
    });

    res.json({
      totalDues,
      totalIncome: 0,
      totalExpenses: 0,
      balance: totalDues,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
