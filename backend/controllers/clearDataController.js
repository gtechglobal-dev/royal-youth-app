import User from "../models/user.js";
import Income from "../models/income.js";
import Expense from "../models/expense.js";

export const clearAllData = async (req, res) => {
  try {
    await Income.deleteMany({});
    await Expense.deleteMany({});

    const members = await User.find({});
    for (const member of members) {
      for (const month of Object.keys(member.dues)) {
        member.dues[month] = {
          status: "Unpaid",
          amount: 0,
          date: null,
          reference: null,
        };
      }
      await member.save();
    }

    res.status(200).json({ message: "All data cleared successfully" });
  } catch (error) {
    console.error("Error clearing data:", error);
    res.status(500).json({ error: error.message });
  }
};