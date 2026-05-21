import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/user.js";

let io;

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
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
