import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "./models/user.js";
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";
import Notification from "./models/Notification.js";
import { sendPushNotification } from "./controllers/pushController.js";
import { onStreamActive, onStreamDone } from "./rtmpServer.js";

function getRtmpUrl() {
  if (process.env.RTMP_URL) return process.env.RTMP_URL;
  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  if (renderUrl) {
    const host = renderUrl.replace(/^https?:\/\//, "");
    return `rtmp://${host}:1935/live`;
  }
  return "rtmp://your-server.com/live";
}

let io;

const activeSessions = new Map();

function broadcastParticipants(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) return;
  io.to(sessionId).emit("participants-update", {
    participants: session.participants,
    raisedHands: session.raisedHands,
  });
}

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

  onStreamActive((streamKey) => {
    for (const [, session] of activeSessions) {
      if (session.streamKey === streamKey) {
        session.streamActive = true;
        io.to(session.sessionId).emit("rtmp-stream-active", { sessionId: session.sessionId });
        break;
      }
    }
  });

  onStreamDone((streamKey) => {
    for (const [, session] of activeSessions) {
      if (session.streamKey === streamKey) {
        session.streamActive = false;
        io.to(session.sessionId).emit("rtmp-stream-ended", { sessionId: session.sessionId });
        break;
      }
    }
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
        const idx = session.participants.findIndex((p) => p.userId === socket.userId);
        if (idx !== -1) {
          session.participants.splice(idx, 1);
          session.raisedHands = session.raisedHands.filter((r) => r.userId !== socket.userId);
          io.to(sessionId).emit("viewer-count", { count: session.participants.length });
          io.to(`user:${session.broadcasterId}`).emit("viewer-left", { userId: socket.userId });
          broadcastParticipants(sessionId);
        }
      }
    });

    socket.on("start-live", async (data, callback) => {
      const sessionId = `live:${socket.userId}:${Date.now()}`;
      const source = data.source || "browser";
      const streamKey = source === "rtmp" ? sessionId : null;
      const rtmpUrl = source === "rtmp" ? getRtmpUrl() : null;
      const hlsUrl = streamKey ? `/hls/${streamKey}/index.m3u8` : null;
      const user = await User.findById(socket.userId).select("firstname surname").lean();
      const displayName = user ? `${user.firstname} ${user.surname}` : "Host";
      const session = {
        sessionId,
        broadcasterId: socket.userId,
        title: data.title || "Live Broadcast",
        description: data.description || "",
        category: data.category || "General",
        type: data.type || "video",
        source,
        streamKey,
        rtmpUrl,
        hlsUrl,
        streamActive: false,
        startedAt: Date.now(),
        participants: [{ userId: socket.userId, displayName, role: "host", muted: false, joinedAt: Date.now() }],
        raisedHands: [],
      };
      activeSessions.set(sessionId, session);
      socket.join(sessionId);
      socket.liveSessionId = sessionId;
      io.emit("live-started", session);

      try {
        const broadcaster = await User.findById(socket.userId).select("firstname friends");
        if (broadcaster?.friends?.length > 0) {
          const friendIds = broadcaster.friends.map((f) => f.toString());
          const name = broadcaster.firstname;
          friendIds.forEach((friendId) => {
            io.to(`user:${friendId}`).emit("live-notification", {
              sessionId,
              broadcasterId: socket.userId,
              title: data.title,
              type: data.type,
            });
          });
          const notifData = friendIds.map((friendId) => ({
            userId: friendId,
            fromUserId: socket.userId,
            type: "live-started",
            referenceId: sessionId,
            body: `${name} is live: ${data.title || "Live Broadcast"}`,
          }));
          await Notification.insertMany(notifData);
          friendIds.forEach((friendId) => {
            io.to(`user:${friendId}`).emit("newNotification", {});
            sendPushNotification(friendId, "Royal Youth Hub",
              `${name} went live! ${data.title || "Live Broadcast"}`,
              `/live/${sessionId}`);
          });
        }
      } catch {}

      if (callback) callback({ success: true, sessionId, streamKey, rtmpUrl, hlsUrl, source });
    });

    socket.on("end-live", async (data, callback) => {
      const sessionId = data?.sessionId || socket.liveSessionId;
      if (!sessionId) return;
      const session = activeSessions.get(sessionId);
      if (!session) return;
      if (session.broadcasterId !== socket.userId) return;
      activeSessions.delete(sessionId);
      io.to(sessionId).emit("live-ended", { sessionId });
      io.socketsLeave(sessionId);
      io.emit("live-ended", { sessionId });

      try {
        const broadcaster = await User.findById(socket.userId).select("firstname friends");
        const name = broadcaster?.firstname || "Someone";
        const mins = session.startedAt ? Math.floor((Date.now() - session.startedAt) / 60000) : 0;
        const timeAgo = mins < 1 ? "a few seconds" : mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;

        const notifDocs = [];

        if (broadcaster) {
          notifDocs.push({
            userId: socket.userId,
            fromUserId: socket.userId,
            type: "live-ended",
            referenceId: sessionId,
            body: `Your live video ended — ${timeAgo} ago`,
          });
        }

        if (broadcaster?.friends?.length > 0) {
          const friendIds = broadcaster.friends.map((f) => f.toString());
          friendIds.forEach((friendId) => {
            notifDocs.push({
              userId: friendId,
              fromUserId: socket.userId,
              type: "live-ended",
              referenceId: sessionId,
              body: `${name}'s live ended ${timeAgo} ago`,
            });
          });
        }

        if (notifDocs.length > 0) {
          await Notification.insertMany(notifDocs);
          const targetIds = [...new Set(notifDocs.map((n) => n.userId))];
          targetIds.forEach((uid) => {
            io.to(`user:${uid}`).emit("newNotification", {});
          });
        }
      } catch {}

      if (callback) callback({ success: true });
    });

    socket.on("join-live", (data) => {
      const { sessionId, displayName } = data;
      const session = activeSessions.get(sessionId);
      if (!session) return socket.emit("live-error", { message: "Session not found" });
      socket.join(sessionId);
      if (!session.participants.find((p) => p.userId === socket.userId)) {
        session.participants.push({
          userId: socket.userId,
          displayName: displayName || `User-${socket.userId.slice(-4)}`,
          role: "listener",
          muted: false,
          joinedAt: Date.now(),
        });
      }
      socket.liveSessionId = sessionId;
      io.to(sessionId).emit("viewer-count", { count: session.participants.length });
      io.to(`user:${session.broadcasterId}`).emit("viewer-joined", { userId: socket.userId, displayName });
      broadcastParticipants(sessionId);
    });

    socket.on("leave-live", (data) => {
      const sessionId = data?.sessionId || socket.liveSessionId;
      if (!sessionId) return;
      const session = activeSessions.get(sessionId);
      socket.leave(sessionId);
      if (session) {
        session.participants = session.participants.filter((p) => p.userId !== socket.userId);
        session.raisedHands = session.raisedHands.filter((r) => r.userId !== socket.userId);
        io.to(sessionId).emit("viewer-count", { count: session.participants.length });
        io.to(`user:${session.broadcasterId}`).emit("viewer-left", { userId: socket.userId });
        broadcastParticipants(sessionId);
      }
      socket.liveSessionId = null;
    });

    socket.on("raise-hand", (data) => {
      const { sessionId } = data;
      const session = activeSessions.get(sessionId);
      if (!session) return;
      if (session.raisedHands.find((r) => r.userId === socket.userId)) return;
      const participant = session.participants.find((p) => p.userId === socket.userId);
      session.raisedHands.push({ userId: socket.userId, displayName: participant?.displayName || "Someone" });
      io.to(`user:${session.broadcasterId}`).emit("hand-raised", { userId: socket.userId, displayName: participant?.displayName || "Someone" });
      broadcastParticipants(sessionId);
    });

    socket.on("lower-hand", (data) => {
      const { sessionId } = data;
      const session = activeSessions.get(sessionId);
      if (!session) return;
      session.raisedHands = session.raisedHands.filter((r) => r.userId !== socket.userId);
      io.to(`user:${session.broadcasterId}`).emit("hand-lowered", { userId: socket.userId });
      broadcastParticipants(sessionId);
    });

    socket.on("grant-mic", (data) => {
      const { sessionId, userId } = data;
      const session = activeSessions.get(sessionId);
      if (!session) return;
      if (session.broadcasterId !== socket.userId) return;
      const participant = session.participants.find((p) => p.userId === userId);
      if (participant) participant.role = "speaker";
      session.raisedHands = session.raisedHands.filter((r) => r.userId !== userId);
      io.to(`user:${userId}`).emit("mic-granted", { sessionId, by: socket.userId });
      broadcastParticipants(sessionId);
    });

    socket.on("revoke-mic", (data) => {
      const { sessionId, userId } = data;
      const session = activeSessions.get(sessionId);
      if (!session) return;
      if (session.broadcasterId !== socket.userId) return;
      const participant = session.participants.find((p) => p.userId === userId);
      if (participant) participant.role = "listener";
      io.to(`user:${userId}`).emit("mic-revoked", { sessionId, by: socket.userId });
      broadcastParticipants(sessionId);
    });

    socket.on("mute-participant", (data) => {
      const { sessionId, userId } = data;
      const session = activeSessions.get(sessionId);
      if (!session) return;
      if (session.broadcasterId !== socket.userId) return;
      const participant = session.participants.find((p) => p.userId === userId);
      if (participant) participant.muted = true;
      io.to(`user:${userId}`).emit("muted-by-host", { sessionId });
      broadcastParticipants(sessionId);
    });

    socket.on("unmute-participant", (data) => {
      const { sessionId, userId } = data;
      const session = activeSessions.get(sessionId);
      if (!session) return;
      if (session.broadcasterId !== socket.userId) return;
      const participant = session.participants.find((p) => p.userId === userId);
      if (participant) participant.muted = false;
      io.to(`user:${userId}`).emit("unmuted-by-host", { sessionId });
      broadcastParticipants(sessionId);
    });

    socket.on("speaker-signal", (data) => {
      const { sessionId, to, signal } = data;
      const session = activeSessions.get(sessionId);
      if (!session) return;
      io.to(`user:${to}`).emit("speaker-signal", { from: socket.userId, signal, sessionId });
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
        participants: s.participants.length,
        raisedHands: s.raisedHands.length,
      }));
      if (callback) callback(sessions);
    });

    socket.on("get-session-info", ({ sessionId }, callback) => {
      const session = activeSessions.get(sessionId);
      if (!session) { if (callback) callback(null); return; }
      if (callback) callback({
        sessionId: session.sessionId,
        broadcasterId: session.broadcasterId,
        title: session.title,
        type: session.type,
        source: session.source || "browser",
        hlsUrl: session.hlsUrl,
        streamActive: !!session.streamActive,
      });
    });

    socket.on("get-rtmp-info", ({ sessionId }, callback) => {
      const session = activeSessions.get(sessionId);
      if (!session || session.source !== "rtmp") {
        if (callback) callback(null);
        return;
      }
      if (callback) callback({
        streamKey: session.streamKey,
        rtmpUrl: session.rtmpUrl,
        hlsUrl: session.hlsUrl,
        streamActive: session.streamActive,
      });
    });

    socket.on("call-user", (data) => {
      const { to, signal, type } = data;
      io.to(`user:${to}`).emit("incoming-call", { from: socket.userId, signal, type });
    });

    socket.on("answer-call", (data) => {
      const { to, signal } = data;
      io.to(`user:${to}`).emit("call-answered", { from: socket.userId, signal });
    });

    socket.on("ice-candidate", (data) => {
      const { to, candidate } = data;
      io.to(`user:${to}`).emit("ice-candidate", { from: socket.userId, candidate });
    });

    async function createCallMessage(callerId, receiverId, callStatus, callType, callDuration) {
      try {
        const conversation = await Conversation.findOne({
          participants: { $all: [callerId, receiverId] },
        });
        if (!conversation) return;
        const msg = await Message.create({
          conversationId: conversation._id,
          senderId: callerId,
          type: "call",
          callType: callType || "audio",
          callStatus,
          callDuration: callDuration || 0,
        });
        conversation.lastMessage = callStatus === "ended" ? "Call ended" : callStatus === "declined" ? "Call declined" : "Missed call";
        conversation.lastSenderId = callerId;
        await conversation.save();
        const populated = await Message.findById(msg._id).populate("senderId", "firstname surname profileImage");
        io.to(`user:${callerId}`).emit("new-message", populated);
        io.to(`user:${receiverId}`).emit("new-message", populated);
      } catch (e) {
        console.error("createCallMessage error:", e);
      }
    }

    socket.on("end-call", (data) => {
      const { to, callType, duration } = data;
      createCallMessage(socket.userId, to, "ended", callType, duration);
      io.to(`user:${to}`).emit("call-ended", { from: socket.userId });
    });

    socket.on("call-declined", (data) => {
      const { to, callType } = data;
      createCallMessage(socket.userId, to, "declined", callType);
      io.to(`user:${to}`).emit("call-declined", { from: socket.userId });
    });

    socket.on("missed-call", (data) => {
      const { to, callType } = data;
      createCallMessage(socket.userId, to, "missed", callType);
      io.to(`user:${to}`).emit("call-ended", { from: socket.userId });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

export const getActiveSessions = () => Array.from(activeSessions.values());
