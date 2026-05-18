import User from "../models/user.js";
import Dues from "../models/dues.js";
import { sendPushNotification } from "./pushController.js";

const sendYouthDayReminders = async (users) => {
  let count = 0;
  for (const user of users) {
    try {
      await sendPushNotification(
        user._id,
        "Royal Youth Hub",
        "Hi Royalty, Please be reminded of our Youth Day celebration fee of N3000. Do well to pay to the Royal Youth Account and send screenshot to our WhatsApp platform for proper documentation. God bless you!",
        "/dashboard"
      );
      count++;
    } catch (_) {}
  }
  console.log(`Youth Day reminders sent: ${count}`);
};

export const sendDuesReminders = async (req, res) => {
  try {
    const allUsers = await User.find({
      isDeleted: false,
      registrationStatus: "Approved",
      membershipStatus: "Active Member",
    }).select("_id firstname surname dues");

    const paidUserIds = await Dues.distinct("user", {
      month: "May",
      status: "Paid",
    });

    const paidStr = paidUserIds.map((id) => id.toString());
    const unpaid = allUsers.filter((u) => !paidStr.includes(u._id.toString()));
    const unpaidIds = unpaid.map((u) => u._id);

    let duesSent = 0;
    for (const uid of unpaidIds) {
      try {
        await sendPushNotification(
          uid,
          "Royal Youth Hub",
          "Hi Royalty, this is a friendly reminder to pay your May dues. Please do well to pay to the Royal Youth Account and send screenshot to our WhatsApp platform. God bless you!",
          "/dashboard"
        );
        duesSent++;
      } catch (_) {}
    }

    // Send Youth Day reminders 3 hours later
    setTimeout(() => sendYouthDayReminders(allUsers), 3 * 60 * 60 * 1000);

    res.json({
      message: "Dues reminders sent. Youth Day reminders scheduled for 3 hours later.",
      duesReminders: duesSent,
      youthDayRemindersScheduled: true,
      totalMembers: allUsers.length,
      unpaidCount: unpaidIds.length,
    });
  } catch (err) {
    console.error("Send reminders error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
