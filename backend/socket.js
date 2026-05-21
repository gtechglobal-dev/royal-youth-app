import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/user.js";

let io;

const activeSessions = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          process.env.FRONTEND_URL_PROD,
          "http://localhost:5173",
          "https://royalyouths.onrender.com",
        ].filter(Boolean);
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id?.toString();
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
    User.findByIdAndUpdate(socket.userId, { lastActive: new Date() }).catch(() => {});

    socket.on("disconnect", () => {
      User.findByIdAndUpdate(socket.userId, { lastActive: new Date() }).catch(() => {});
      for (const [sessionId, session] of activeSessions) {
        if (session.broadcasterId === socket.userId) {
          activeSessions.delete(sessionId);
          io.emit("live-ended", { sessionId });
          break;
        }
      }
    });

    socket.on("start-live", async (data, callback) => {
      const sessionId = `live:${socket.userId}:${Date.now()}`;
      const session = {
        sessionId,
        broadcasterId: socket.userId,
        title: data.title || "Live Broadcast",
        description: data.description || "",
        category: data.category || "General",
        type: data.type || "video",
        startedAt: Date.now(),
        viewers: [],
      };
      activeSessions.set(sessionId, session);
      socket.join(sessionId);
      socket.liveSessionId = sessionId;
      io.emit("live-started", session);

      try {
        const broadcaster = await User.findById(socket.userId).select("friends");
        if (broadcaster?.friends?.length > 0) {
          const friendIds = broadcaster.friends.map((f) => f.toString());
          friendIds.forEach((friendId) => {
            io.to(`user:${friendId}`).emit("live-notification", {
              sessionId,
              broadcasterId: socket.userId,
              title: data.title,
              type: data.type,
            });
          });
        }
      } catch {}

      if (callback) callback({ success: true, sessionId });
    });

    socket.on("end-live", (data, callback) => {
      const sessionId = data?.sessionId || socket.liveSessionId;
      if (!sessionId) return;
      const session = activeSessions.get(sessionId);
      if (!session) return;
      if (session.broadcasterId !== socket.userId) return;
      activeSessions.delete(sessionId);
      io.to(sessionId).emit("live-ended", { sessionId });
      io.socketsLeave(sessionId);
      io.emit("live-ended", { sessionId });
      if (callback) callback({ success: true });
    });

    socket.on("join-live", (data) => {
      const { sessionId } = data;
      const session = activeSessions.get(sessionId);
      if (!session) return socket.emit("live-error", { message: "Session not found" });
      socket.join(sessionId);
      if (!session.viewers.includes(socket.userId)) {
        session.viewers.push(socket.userId);
      }
      socket.liveSessionId = sessionId;
      io.to(sessionId).emit("viewer-count", { count: session.viewers.length });
      io.to(`user:${session.broadcasterId}`).emit("viewer-joined", { userId: socket.userId });
    });

    socket.on("leave-live", (data) => {
      const sessionId = data?.sessionId || socket.liveSessionId;
      if (!sessionId) return;
      const session = activeSessions.get(sessionId);
      socket.leave(sessionId);
      if (session) {
        session.viewers = session.viewers.filter((id) => id !== socket.userId);
        io.to(sessionId).emit("viewer-count", { count: session.viewers.length });
        io.to(`user:${session.broadcasterId}`).emit("viewer-left", { userId: socket.userId });
      }
      socket.liveSessionId = null;
    });

    socket.on("signal", (data) => {
      const { to, signal } = data;
      io.to(`user:${to}`).emit("signal", { from: socket.userId, signal });
    });

    socket.on("live-message", (data) => {
      const { sessionId, text } = data;
      const session = activeSessions.get(sessionId);
      if (!session) return;
      io.to(sessionId).emit("live-message", { userId: socket.userId, text, timestamp: Date.now() });
    });

    socket.on("live-reaction", (data) => {
      const { sessionId, emoji } = data;
      const session = activeSessions.get(sessionId);
      if (!session) return;
      io.to(sessionId).emit("live-reaction", { userId: socket.userId, emoji });
    });

    socket.on("get-active-sessions", (_, callback) => {
      const sessions = Array.from(activeSessions.values()).map((s) => ({
        ...s,
        viewers: s.viewers.length,
      }));
      if (callback) callback(sessions);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const getActiveSessions = () => Array.from(activeSessions.values());
