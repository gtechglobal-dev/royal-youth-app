import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "../services/socket";

const LiveContext = createContext(null);

export function LiveProvider({ children }) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [liveRoom, setLiveRoom] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const myStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onLiveStarted = (session) => {
      setActiveSessions((prev) => {
        if (prev.find((s) => s.sessionId === session.sessionId)) return prev;
        return [...prev, session];
      });
    };

    const onLiveEnded = ({ sessionId }) => {
      setActiveSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      if (liveRoom?.sessionId === sessionId) {
        handleLeaveLive();
      }
    };

    const onSignal = async ({ from, signal }) => {
      if (liveRoom?.isBroadcaster) return;
      if (signal.type === "offer") {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        peerConnectionsRef.current[from] = pc;

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("signal", { to: from, signal: { type: "candidate", candidate: e.candidate } });
          }
        };

        pc.ontrack = (e) => {
          if (myStreamRef.current) {
            myStreamRef.current.getVideoTracks().forEach((t) => myStreamRef.current.removeTrack(t));
            myStreamRef.current.getAudioTracks().forEach((t) => myStreamRef.current.removeTrack(t));
          }
          const remoteStream = new MediaStream();
          e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
          myStreamRef.current = remoteStream;
        };

        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("signal", { to: from, signal: answer });
      } else if (signal.type === "answer" && liveRoom?.isBroadcaster) {
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

    socket.on("live-started", onLiveStarted);
    socket.on("live-ended", onLiveEnded);
    socket.on("signal", onSignal);

    socket.emit("get-active-sessions", (sessions) => {
      setActiveSessions(sessions);
    });

    return () => {
      socket.off("live-started", onLiveStarted);
      socket.off("live-ended", onLiveEnded);
      socket.off("signal", onSignal);
    };
  }, []);

  const cleanupPeerConnections = useCallback(() => {
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      pc.close();
    });
    peerConnectionsRef.current = {};
    if (myStreamRef.current) {
      myStreamRef.current.getTracks().forEach((t) => t.stop());
      myStreamRef.current = null;
    }
  }, []);

  const startLive = useCallback(async (data) => {
    const socket = getSocket();
    if (!socket) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: data.type === "video",
      audio: true,
    });
    myStreamRef.current = stream;

    return new Promise((resolve) => {
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
        }
      });
    });
  }, []);

  const joinLive = useCallback(async (session) => {
    const socket = getSocket();
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

    socket.emit("signal", {
      to: session.broadcasterId,
      signal: { type: "join-request" },
    });
  }, []);

  const handleLeaveLive = useCallback(() => {
    const socket = getSocket();
    if (liveRoom) {
      if (liveRoom.isBroadcaster) {
        socket.emit("end-live", { sessionId: liveRoom.sessionId });
      } else {
        socket.emit("leave-live", { sessionId: liveRoom.sessionId });
      }
    }
    cleanupPeerConnections();
    setLiveRoom(null);
  }, [liveRoom, cleanupPeerConnections]);

  const sendMessage = useCallback((text) => {
    const socket = getSocket();
    if (!socket || !liveRoom) return;
    socket.emit("live-message", { sessionId: liveRoom.sessionId, text });
  }, [liveRoom]);

  const sendReaction = useCallback((emoji) => {
    const socket = getSocket();
    if (!socket || !liveRoom) return;
    socket.emit("live-reaction", { sessionId: liveRoom.sessionId, emoji });
  }, [liveRoom]);

  return (
    <LiveContext.Provider
      value={{
        activeSessions,
        liveRoom,
        incomingCall,
        myStreamRef,
        peerConnectionsRef,
        startLive,
        joinLive,
        handleLeaveLive,
        sendMessage,
        sendReaction,
      }}
    >
      {children}
    </LiveContext.Provider>
  );
}

export const useLive = () => useContext(LiveContext);
