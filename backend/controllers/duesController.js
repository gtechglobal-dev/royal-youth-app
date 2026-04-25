import Dues from "../models/dues.js";

// ADMIN MARK DUES

export const markDues = async (req, res) => {
  try {
    const { userId, month, amount, status } = req.body;

    let record = await Dues.findOne({ user: userId, month });

    if (record) {
      record.amount = amount;
      record.status = status;
      record.paymentDate = new Date();

      await record.save();
    } else {
      record = new Dues({
        user: userId,
        month,
        amount,
        status,
        paymentDate: new Date(),
      });

      await record.save();
    }

    res.json({ message: "Dues updated successfully", record });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// MEMBER VIEW THEIR DUES

export const getUserDues = async (req, res) => {
  try {
    const dues = await Dues.find({ user: req.user._id });

    res.json(dues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
