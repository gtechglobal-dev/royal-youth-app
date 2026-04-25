import Attendance from "../models/attendance.js";

// CREATE MEETING
export const createMeeting = async (req, res) => {
  try {
    const { meetingTitle, meetingDate } = req.body;

    const meeting = new Attendance({
      meetingTitle,
      meetingDate,
      user: null,
      status: "Absent",
      isMeeting: true,
    });

    await meeting.save();

    res.json({
      message: "Meeting created",
      meeting,
    });
  } catch (error) {
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

    const attendance = await Attendance.find({ meeting: meetingId }).populate(
      "user",
      "firstname surname"
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

// MEMBER VIEW ATTENDANCE

export const getUserAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ user: req.user._id });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
