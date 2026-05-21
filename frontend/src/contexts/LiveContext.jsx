import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getSocket, connectSocket } from "../services/socket";

const LiveContext = createContext(null);

export function LiveProvider({ children }) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [liveRoom, setLiveRoom] = useState(null);
  const [liveNotifs, setLiveNotifs] = useState([]);
  const myStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const liveRoomRef = useRef(null);

  useEffect(() => {
    liveRoomRef.current = liveRoom;
  }, [liveRoom]);

  const ensureSocket = useCallback(() => {
    let socket = getSocket();
    if (!socket || !socket.connected) {
      socket = connectSocket();
    }
    return socket;
  }, []);

  useEffect(() => {
    const socket = ensureSocket();
    if (!socket) return;

    const onLiveStarted = (session) => {
      setActiveSessions((prev) => {
        if (prev.find((s) => s.sessionId === session.sessionId)) return prev;
        return [...prev, session];
      });
    };

    const onLiveEnded = ({ sessionId }) => {
      setActiveSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    };

    const onViewerJoined = async ({ userId }) => {
      const room = liveRoomRef.current;
      if (!room?.isBroadcaster || !myStreamRef.current) return;
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peerConnectionsRef.current[userId] = pc;

      myStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, myStreamRef.current));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("signal", { to: userId, signal: { type: "candidate", candidate: e.candidate } });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("signal", { to: userId, signal: offer });
    };

    const onViewerLeft = ({ userId }) => {
      const pc = peerConnectionsRef.current[userId];
      if (pc) {
        pc.close();
        delete peerConnectionsRef.current[userId];
      }
    };

    const onSignal = async ({ from, signal }) => {
      if (signal.type === "offer") {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        peerConnectionsRef.current[from] = pc;

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("signal", { to: from, signal: { type: "candidate", candidate: e.candidate } });
          }
        };

        pc.ontrack = (e) => {
          const remoteStream = new MediaStream();
          e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
          myStreamRef.current = remoteStream;
          setLiveRoom((prev) => prev ? { ...prev, stream: remoteStream } : prev);
        };

        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("signal", { to: from, signal: answer });
      } else if (signal.type === "answer") {
        const pc = peerConnectionsRef.current[from];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        }
      } else if (signal.type === "candidate") {
        const pc = peerConnectionsRef.current[from];
        if (pc && signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      }
    };

    const onLiveNotification = (notif) => {
      setLiveNotifs((prev) => [...prev, { ...notif, id: Date.now() }]);
      setTimeout(() => setLiveNotifs((prev) => prev.slice(1)), 5000);
    };

    socket.on("live-started", onLiveStarted);
    socket.on("live-ended", onLiveEnded);
    socket.on("viewer-joined", onViewerJoined);
    socket.on("viewer-left", onViewerLeft);
    socket.on("signal", onSignal);
    socket.on("live-notification", onLiveNotification);

    socket.emit("get-active-sessions", (sessions) => {
      setActiveSessions(sessions);
    });

    return () => {
      socket.off("live-started", onLiveStarted);
      socket.off("live-ended", onLiveEnded);
      socket.off("viewer-joined", onViewerJoined);
      socket.off("viewer-left", onViewerLeft);
      socket.off("signal", onSignal);
      socket.off("live-notification", onLiveNotification);
    };
  }, []);

  const cleanupPeerConnections = useCallback(() => {
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};
    if (myStreamRef.current) {
      myStreamRef.current.getTracks().forEach((t) => t.stop());
      myStreamRef.current = null;
    }
  }, []);

  const startLive = useCallback(async (data) => {
    const socket = ensureSocket();
    if (!socket) throw new Error("No socket connection");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: data.type === "video",
      audio: true,
    });
    myStreamRef.current = stream;

    return new Promise((resolve, reject) => {
      socket.emit("start-live", data, (res) => {
        if (res.success) {
          setLiveRoom({
            sessionId: res.sessionId,
            isBroadcaster: true,
            title: data.title,
            description: data.description,
            category: data.category,
            type: data.type,
            startedAt: Date.now(),
            stream,
          });
          resolve(res);
        } else {
          reject(new Error("Failed to start live"));
        }
      });
    });
  }, [ensureSocket]);

  const joinLive = useCallback(async (session) => {
    const socket = ensureSocket();
    if (!socket) return;

    socket.emit("join-live", { sessionId: session.sessionId });

    const stream = new MediaStream();
    myStreamRef.current = stream;

    setLiveRoom({
      sessionId: session.sessionId,
      isBroadcaster: false,
      broadcasterId: session.broadcasterId,
      title: session.title,
      type: session.type,
      stream,
    });
  }, [ensureSocket]);

  const handleLeaveLive = useCallback(() => {
    const socket = getSocket();
    if (liveRoomRef.current) {
      if (liveRoomRef.current.isBroadcaster) {
        socket?.emit("end-live", { sessionId: liveRoomRef.current.sessionId });
      } else {
        socket?.emit("leave-live", { sessionId: liveRoomRef.current.sessionId });
      }
    }
    cleanupPeerConnections();
    setLiveRoom(null);
  }, [cleanupPeerConnections]);

  const sendMessage = useCallback((text) => {
    const socket = getSocket();
    if (!socket || !liveRoomRef.current) return;
    socket.emit("live-message", { sessionId: liveRoomRef.current.sessionId, text });
  }, []);

  const sendReaction = useCallback((emoji) => {
    const socket = getSocket();
    if (!socket || !liveRoomRef.current) return;
    socket.emit("live-reaction", { sessionId: liveRoomRef.current.sessionId, emoji });
  }, []);

  const dismissLiveNotif = useCallback((id) => {
    setLiveNotifs((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <LiveContext.Provider
      value={{
        activeSessions,
        liveRoom,
        liveNotifs,
        myStreamRef,
        peerConnectionsRef,
        startLive,
        joinLive,
        handleLeaveLive,
        sendMessage,
        sendReaction,
        dismissLiveNotif,
      }}
    >
      {children}
    </LiveContext.Provider>
  );
}

export const useLive = () => useContext(LiveContext);
