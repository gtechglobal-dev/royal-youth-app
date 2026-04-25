import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import duesRoutes from "./routes/duesRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import clearDataRoutes from "./routes/clearDataRoutes.js";

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/dues", duesRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", clearDataRoutes);

app.get("/", (req, res) => {
  res.send("Royal Youth API running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
