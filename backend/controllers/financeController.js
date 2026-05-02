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
    const months2026 = ["May", "June", "July", "August", "September", "October", "November", "December"];

    months2026.forEach(month => {
      members.forEach(member => {
        if (member.dues[month]?.status === "Paid") {
          totalDues += Number(member.dues[month].amount || 2000);
        }
      });
    });

    // Get OTHER income only (NO memberId) - exclude dues payments
    const otherIncome = await Income.find({
      memberId: { $exists: false },
      purpose: { $not: /2026 Dues|Dues -/ }
    });
    const totalOtherIncome = otherIncome.reduce((sum, inc) => sum + inc.amount, 0);

    // Get Special Donations (WITH memberId) - exclude dues payments
    const specialDonations = await Income.find({
      memberId: { $exists: true, $ne: null },
      purpose: { $not: /2026 Dues|Dues -/ }
    });
    const totalSpecialDonations = specialDonations.reduce((sum, don) => sum + don.amount, 0);

    // Get expenses
    const expenses = await Expense.find();
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    res.status(200).json({
      totalDues,
      totalOtherIncome,
      totalSpecialDonations,
      totalExpenses,
      balance: totalDues + totalOtherIncome + totalSpecialDonations - totalExpenses,
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

// UPDATE INCOME
export const updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const { purpose, amount, date } = req.body;

    const income = await Income.findById(id);
    if (!income) {
      return res.status(404).json({ message: "Income record not found" });
    }

    income.purpose = purpose || income.purpose;
    income.amount = amount || income.amount;
    income.date = date || income.date;

    await income.save();

    res.status(200).json({ message: "Income updated successfully", income });
  } catch (error) {
    console.error("Error updating income:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE INCOME
export const deleteIncome = async (req, res) => {
  try {
    const { id } = req.params;

    const income = await Income.findById(id);
    if (!income) {
      return res.status(404).json({ message: "Income record not found" });
    }

    await income.deleteOne();

    res.status(200).json({ message: "Income deleted successfully" });
  } catch (error) {
    console.error("Error deleting income:", error);
    res.status(500).json({ error: error.message });
  }
};
