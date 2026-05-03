import express from "express";
import MeetingResponse from "../models/meetingResponse.js";

const router = express.Router();

// Submit meeting response (members)
router.post("/", async (req, res) => {
  try {
    const { userId, meetingTitle, response } = req.body;
    
    if (!userId || !meetingTitle || !response) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const meetingResponse = new MeetingResponse({
      user: userId,
      meetingTitle,
      response
    });

    await meetingResponse.save();
    res.status(201).json({ message: "Response submitted successfully", meetingResponse });
  } catch (error) {
    console.error("Error submitting meeting response:", error);
    res.status(500).json({ error: "Failed to submit response" });
  }
});

// Get all meeting responses (admin)
router.get("/all", async (req, res) => {
  try {
    const responses = await MeetingResponse.find()
      .populate("user", "firstname surname phone")
      .sort({ createdAt: -1 });
    res.json(responses);
  } catch (error) {
    console.error("Error fetching meeting responses:", error);
    res.status(500).json({ error: "Failed to fetch responses" });
  }
});

// Get responses by meeting title (admin) - using query param instead of route param
router.get("/meeting", async (req, res) => {
  try {
    const { title } = req.query;
    const query = title ? { meetingTitle: title } : {};
    const responses = await MeetingResponse.find(query)
      .populate("user", "firstname surname phone")
      .sort({ createdAt: -1 });
    res.json(responses);
  } catch (error) {
    console.error("Error fetching meeting responses:", error);
    res.status(500).json({ error: "Failed to fetch responses" });
  }
});

// Delete a meeting response (admin)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MeetingResponse.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Response not found" });
    }
    res.json({ message: "Response deleted successfully" });
  } catch (error) {
    console.error("Error deleting meeting response:", error);
    res.status(500).json({ error: "Failed to delete response" });
  }
});

export default router;
