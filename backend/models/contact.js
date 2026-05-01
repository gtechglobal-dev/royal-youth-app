import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  type: { type: String, enum: ["prayer", "testimony", "complaint"], required: true },
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model("Contact", contactSchema);
export default Contact;