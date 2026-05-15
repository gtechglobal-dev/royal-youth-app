import User from "../models/user.js";
import Post from "../models/Post.js";
import Attendance from "../models/attendance.js";

export const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({
      registrationStatus: "Approved",
      isDeleted: false,
    }).select("_id firstname surname profileImage membershipStatus");

    const userIds = users.map((u) => u._id);

    const postCounts = await Post.aggregate([
      { $match: { userId: { $in: userIds }, isDeleted: false } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const postMap = {};
    postCounts.forEach((p) => { postMap[p._id.toString()] = p.count; });

    const attendanceCounts = await Attendance.aggregate([
      { $match: { user: { $in: userIds }, status: "Present" } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]);
    const attendanceMap = {};
    attendanceCounts.forEach((a) => { attendanceMap[a._id.toString()] = a.count; });

    const scored = users.map((u) => {
      const id = u._id.toString();
      const posts = postMap[id] || 0;
      const attendance = attendanceMap[id] || 0;
      const activeBonus = u.membershipStatus === "Active Member" ? 30 : 0;
      const score = posts * 10 + attendance * 15 + activeBonus;

      return {
        _id: u._id,
        firstname: u.firstname,
        surname: u.surname,
        profileImage: u.profileImage,
        score,
        posts,
        attendance,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const top10 = scored.slice(0, 10).map((u, i) => ({ ...u, rank: i + 1 }));

    res.json(top10);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
