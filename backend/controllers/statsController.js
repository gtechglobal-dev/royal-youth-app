import Post from "../models/Post.js";
import User from "../models/User.js";
import Attendance from "../models/attendanceModel.js";

export const getMonthlyStats = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const postCounts = await Post.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) } } },
      { $group: { _id: { $dateToString: { format: "%m", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const userCounts = await User.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) } } },
      { $group: { _id: { $dateToString: { format: "%m", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const attendanceCounts = await Attendance.aggregate([
      { $match: { date: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) } } },
      { $group: { _id: { $dateToString: { format: "%m", date: "$date" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

    const monthlyData = months.map((m) => ({
      month: m,
      name: new Date(`${year}-${m}-01`).toLocaleString("default", { month: "short" }),
      posts: (postCounts.find((p) => p._id === m)?.count) || 0,
      registrations: (userCounts.find((u) => u._id === m)?.count) || 0,
      attendance: (attendanceCounts.find((a) => a._id === m)?.count) || 0,
    }));

    res.json(monthlyData);
  } catch (err) {
    console.error("Monthly stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
