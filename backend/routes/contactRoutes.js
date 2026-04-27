import express from "express";
import Contact from "../models/contact.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { type, name, phone, email, message } = req.body;
    if (!type || !name || !message) {
      return res.status(400).json({ error: "Type, name, and message are required" });
    }
    if (type !== "complaint" && !email) {
      return res.status(400).json({ error: "Address is required for prayer requests and testimonies" });
    }
    const contact = new Contact({ type, name, phone, email, message });
    await contact.save();
    res.status(201).json({ message: "Submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:type", async (req, res) => {
  try {
    const contacts = await Contact.find({ type: req.params.type }).sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;