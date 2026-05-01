import User from "../models/user.js";
import Income from "../models/income.js";

const initializePayment = async (req, res) => {
  try {
    const { month, amount } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const reference = `DUE_${month}_${Date.now()}_${user._id}`;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email: "royalyouthsc4c5@gmail.com",
        amount: amount * 100,
        reference,
        metadata: {
          userId: user._id.toString(),
          month,
          type: "dues",
        },
        callback_url: `${process.env.FRONTEND_URL}/dashboard`,
      }),
    });

    const data = await response.json();

    if (data.status) {
      user.dues[month].status = "Pending";
      user.dues[month].amount = amount;
      user.dues[month].reference = reference;
      await user.save();

      res.status(200).json({
        authorization_url: data.data.authorization_url,
        reference: data.data.reference,
        key: process.env.PAYSTACK_PUBLIC_KEY,
      });
    } else {
      console.error("Paystack error:", data);
      res.status(400).json({ message: data.message || "Failed to initialize payment" });
    }
  } catch (error) {
    console.error("Payment initialization error:", error);
    res.status(500).json({ error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.body;

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.status && data.data.status === "success") {
      // Get metadata from Paystack response - this contains the month
      const metadata = data.data.metadata;
      
      if (!metadata || !metadata.userId || !metadata.month) {
        return res.status(400).json({ message: "Invalid payment metadata" });
      }

      const user = await User.findById(metadata.userId);

      if (user && user.dues[metadata.month]) {
        const amountPaid = user.dues[metadata.month].amount;
        user.dues[metadata.month].status = "Paid";
        user.dues[metadata.month].date = new Date();
        user.dues[metadata.month].reference = undefined;
        await user.save();

        const income = new Income({
          purpose: `2026 Dues - ${metadata.month} (${user.firstname} ${user.surname})`,
          amount: amountPaid,
          date: new Date(),
          memberId: user._id,
        });
        await income.save();

        res.status(200).json({ message: "Payment verified successfully" });
      } else {
        res.status(400).json({ message: "User or dues record not found" });
      }
    } else {
      res.status(400).json({ message: "Payment not successful" });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: error.message });
  }
};

const handlePaystackWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (event.event === "charge.success") {
      const { reference, metadata, amount } = event.data;

      if (metadata) {
        if (metadata.type === "dues" && metadata.userId && metadata.month) {
          const user = await User.findById(metadata.userId);

          if (user) {
            user.dues[metadata.month].status = "Paid";
            user.dues[metadata.month].date = new Date();
            user.dues[metadata.month].reference = undefined;
            await user.save();

            const income = new Income({
              purpose: `2026 Dues - ${metadata.month} (${user.firstname} ${user.surname})`,
              amount: amount / 100,
              date: new Date(),
              memberId: user._id,
            });
            await income.save();
          }
        } else if (metadata.type === "special" && metadata.userId && metadata.purpose) {
          const user = await User.findById(metadata.userId);

          if (user) {
            const income = new Income({
              purpose: metadata.purpose,
              amount: amount / 100,
              date: new Date(),
              memberId: user._id,
            });
            await income.save();
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getDuesIncome = async (req, res) => {
  try {
    const members = await User.find({ isDeleted: false });

    let totalIncome = 0;
    const monthlyIncome = {
      January: 0,
      February: 0,
      March: 0,
      April: 0,
      May: 0,
      June: 0,
      July: 0,
      August: 0,
      September: 0,
      October: 0,
      November: 0,
      December: 0,
    };

    members.forEach((member) => {
      Object.keys(monthlyIncome).forEach((month) => {
        if (member.dues[month]?.status === "Paid") {
          monthlyIncome[month] += member.dues[month]?.amount || 2000;
        }
      });
    });

    totalIncome = Object.values(monthlyIncome).reduce((a, b) => a + b, 0);

    res.status(200).json({
      totalIncome,
      monthlyIncome,
      memberCount: members.length,
    });
  } catch (error) {
    console.error("Error getting dues income:", error);
    res.status(500).json({ error: error.message });
  }
};

export const initializeSpecialPayment = async (req, res) => {
  try {
    const { purpose, amount } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const reference = `SPECIAL_${Date.now()}_${user._id}`;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email: "royalyouthsc4c5@gmail.com",
        amount: amount * 100,
        reference,
        metadata: {
          userId: user._id.toString(),
          purpose,
          type: "special",
        },
        callback_url: `${process.env.FRONTEND_URL}/dashboard`,
      }),
    });

    const data = await response.json();

    if (data.status) {
      res.status(200).json({
        authorization_url: data.data.authorization_url,
        reference: data.data.reference,
        key: process.env.PAYSTACK_PUBLIC_KEY,
      });
    } else {
      console.error("Paystack error:", data);
      res.status(400).json({ message: data.message || "Failed to initialize payment" });
    }
  } catch (error) {
    console.error("Special payment initialization error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const verifySpecialPayment = async (req, res) => {
  try {
    const { reference, purpose, amount } = req.body;

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.status && data.data.status === "success") {
      const user = await User.findById(req.user.id);
      
      if (user) {
        const income = new Income({
          purpose: purpose || "Special Donation",
          amount: amount,
          date: new Date(),
          memberId: user._id,
        });
        await income.save();
      }

      res.status(200).json({ message: "Special payment verified successfully" });
    } else {
      res.status(400).json({ message: "Payment not successful" });
    }
  } catch (error) {
    console.error("Special payment verification error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getSpecialPayments = async (req, res) => {
  try {
    const incomes = await Income.find({
      memberId: req.user.id,
      purpose: { $not: /2026 Dues|Dues -/ }
    }).sort({ createdAt: -1 });
    
    res.status(200).json(incomes);
  } catch (error) {
    console.error("Error getting special payments:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllSpecialDonations = async (req, res) => {
  try {
    const specialDonations = await Income.find({
      memberId: { $exists: true, $ne: null },
      purpose: { $not: /2026 Dues|Dues -/ }
    }).populate("memberId", "firstname surname").sort({ createdAt: -1 });
    
    res.status(200).json(specialDonations);
  } catch (error) {
    console.error("Error getting all special donations:", error);
    res.status(500).json({ error: error.message });
  }
};

export const addSpecialDonation = async (req, res) => {
  try {
    const { purpose, amount, memberId, date } = req.body;
    
    const income = new Income({
      purpose,
      amount,
      date: date ? new Date(date) : new Date(),
      memberId,
    });
    await income.save();
    
    res.status(201).json(income);
  } catch (error) {
    console.error("Error adding special donation:", error);
    res.status(500).json({ error: error.message });
  }
};

export { initializePayment, verifyPayment, handlePaystackWebhook, getDuesIncome };
