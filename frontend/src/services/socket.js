import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || undefined;

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  if (socket) {
    if (socket.connected) return socket;
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const waitForSocket = (timeout = 15000) => {
  const s = connectSocket();
  if (!s) return Promise.reject(new Error("No socket connection"));
  if (s.connected) return Promise.resolve(s);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      s.off("connect", onConnect);
      s.off("connect_error", onError);
      reject(new Error("Socket connection timed out"));
    }, timeout);
    const onConnect = () => {
      clearTimeout(timer);
      s.off("connect_error", onError);
      resolve(s);
    };
    const onError = (err) => {
      clearTimeout(timer);
      s.off("connect", onConnect);
      reject(new Error(`Socket connection failed: ${err.message}`));
    };
    s.on("connect", onConnect);
    s.on("connect_error", onError);
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
