import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { initSocket } from "./socket.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import duesRoutes from "./routes/duesRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import clearDataRoutes from "./routes/clearDataRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import meetingResponseRoutes from "./routes/meetingResponseRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import friendRoutes from "./routes/friendRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import feedRoutes from "./routes/feedRoutes.js";
import feedSourceRoutes from "./routes/feedSourceRoutes.js";
import { seedFeedSources } from "./controllers/feedSourceController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(compression());

// ✅ Connect DB
connectDB();
seedFeedSources();

// ✅ CORS CONFIG
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL_PROD,
      "http://localhost:5173",
      "https://royalyouths.onrender.com",
      "https://royal-youth-app.gtechglobal-dev.workers.dev"
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/dues", duesRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", clearDataRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/meeting-responses", meetingResponseRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/feeds", feedRoutes);
app.use("/api/admin/feed-sources", feedSourceRoutes);
// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ message });
});

// ✅ Serve frontend in production with CDN-friendly caching
const frontendDist = path.resolve(__dirname, "..", "frontend", "dist");
const oneYear = 365 * 24 * 60 * 60;

app.use(express.static(frontendDist, {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', `public, max-age=${oneYear}, immutable`);
    }
  }
}));

// ✅ SPA catch-all — serve index.html for unmatched GET routes
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"), {
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
  });
});

// ✅ API caching: allow CDN to cache GET responses briefly
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-cache, private, max-age=60');
  }
  next();
});

// ✅ Keep free Render instance awake
const SELF_URL = process.env.SELF_URL;
if (SELF_URL) {
  setInterval(async () => {
    try {
      await fetch(SELF_URL);
      console.log("🔄 Self-ping kept alive");
    } catch (err) {
      console.log("Self-ping failed (expected on free tier)");
    }
  }, 5 * 60 * 1000); // every 5 minutes
}

// ✅ Start server
const PORT = process.env.PORT || 5000;
const server = createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
