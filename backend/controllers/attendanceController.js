import Attendance from "../models/attendance.js";

// CREATE MEETING
export const createMeeting = async (req, res) => {
  try {
    const { meetingTitle, meetingDate } = req.body;
    const User = await import("../models/user.js").then(m => m.default);

    console.log("Creating meeting:", meetingTitle, meetingDate);

    // Create the meeting record
    const meeting = new Attendance({
      meetingTitle,
      meetingDate,
      user: null,
      status: "Absent",
      isMeeting: true,
    });

    await meeting.save();
    console.log("Meeting saved:", meeting._id);

    // Get all members who should have attendance tracked
    // Include both "Active Member" and "Inactive Member" with "Approved" registration
    const members = await User.find({ 
      isDeleted: false, 
      registrationStatus: "Approved"
    }).select("_id firstname surname membershipStatus registrationStatus");

    console.log("Found", members.length, "active/approved members");

    if (members.length === 0) {
      console.log("No eligible members found! Checking all non-deleted members:");
      const allMembers = await User.find({ isDeleted: false }).select("_id firstname surname membershipStatus registrationStatus");
      allMembers.forEach(m => {
        console.log(`  - ${m.firstname} ${m.surname}: membershipStatus="${m.membershipStatus}", registrationStatus="${m.registrationStatus}"`);
      });
    } else {
      members.forEach(m => {
        console.log(`  - ${m.firstname} ${m.surname}: ${m._id} (${m.membershipStatus || m.registrationStatus})`);
      });
    }

    // Create attendance records for each member
    const attendanceRecords = members.map(member => ({
      meetingTitle,
      meetingDate: new Date(meetingDate),
      user: member._id,
      status: "Absent",
      isMeeting: false,
    }));

    const result = await Attendance.insertMany(attendanceRecords);
    console.log("Created", result.length, "attendance records");
    
    res.json({
      message: "Meeting created with attendance records",
      meeting,
      recordsCreated: attendanceRecords.length,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET ALL MEETINGS
export const getAllMeetings = async (req, res) => {
  try {
    const meetings = await Attendance.find({ isMeeting: true }).sort({
      meetingDate: -1,
    });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ATTENDANCE FOR MEETING
export const getMeetingAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const attendance = await Attendance.findById(meetingId).populate(
      "user",
      "nickname firstname surname"
    );

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADMIN MARK ATTENDANCE

export const markAttendance = async (req, res) => {
  try {
    const { userId, meetingTitle, meetingDate, status } = req.body;

    let record = await Attendance.findOne({
      user: userId,
      meetingTitle,
      meetingDate,
    });

    if (record) {
      record.status = status;
      await record.save();
    } else {
      record = new Attendance({
        user: userId,
        meetingTitle,
        meetingDate,
        status,
      });

      await record.save();
    }

    res.json({
      message: "Attendance updated",
      record,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL ATTENDANCE RECORDS
export const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ isMeeting: false }).select("_id user meetingTitle meetingDate status");
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// MEMBER VIEW ATTENDANCE

export const getUserAttendance = async (req, res) => {
  try {
    if (req.user.role === "admin" || req.user._id === "admin") {
      return res.json([]);
    }

    const User = await import("../models/user.js").then(m => m.default);
    const userData = await User.findById(req.user._id).select("createdAt");

    const attendance = await Attendance.find({
      user: req.user._id,
      createdAt: { $gte: userData.createdAt }
    });

    res.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE MEETING
export const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { meetingTitle, meetingDate } = req.body;

    const meeting = await Attendance.findById(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    const oldTitle = meeting.meetingTitle;
    const oldDate = meeting.meetingDate;

    meeting.meetingTitle = meetingTitle;
    meeting.meetingDate = meetingDate;
    await meeting.save();

    await Attendance.updateMany(
      { meetingTitle: oldTitle, meetingDate: oldDate, isMeeting: false },
      { $set: { meetingTitle, meetingDate } }
    );

    res.json({ message: "Meeting updated", meeting });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE MEETING
export const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Attendance.findById(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    
    await Attendance.findByIdAndDelete(id);
    
    await Attendance.deleteMany({
      meetingTitle: meeting.meetingTitle,
      meetingDate: meeting.meetingDate,
      isMeeting: false
    });
    
    res.json({ message: "Meeting deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
