import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getSocket, connectSocket, waitForSocket } from "../services/socket";

const LiveContext = createContext(null);

export function LiveProvider({ children }) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [liveRoom, setLiveRoom] = useState(null);
  const [liveNotifs, setLiveNotifs] = useState([]);
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [callState, setCallState] = useState({ status: "idle" });
  const [participants, setParticipants] = useState([]);
  const [raisedHands, setRaisedHands] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const myStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const liveRoomRef = useRef(null);
  const callPCRef = useRef(null);
  const listenersReadyRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const speakerPCRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const callMissedTimeoutRef = useRef(null);
  const callPendingOfferRef = useRef(null);
  const liveStartTimeRef = useRef(null);
  const [liveEndedNotif, setLiveEndedNotif] = useState(null);

  useEffect(() => {
    liveRoomRef.current = liveRoom;
  }, [liveRoom]);

  useEffect(() => {
    if (listenersReadyRef.current) return;

    const socket = getSocket();
    if (!socket || !socket.connected) {
      const s = connectSocket();
      if (!s) return;
      const onConnect = () => {
        registerListeners(s);
        s.emit("get-active-sessions", (sessions) => setActiveSessions(sessions));
      };
      if (s.connected) {
        onConnect();
      } else {
        s.on("connect", onConnect);
      }
      return () => {
        s.off("connect", onConnect);
        unregisterListeners(s);
        listenersReadyRef.current = false;
      };
    } else {
      registerListeners(socket);
      socket.emit("get-active-sessions", (sessions) => setActiveSessions(sessions));
      return () => {
        unregisterListeners(socket);
        listenersReadyRef.current = false;
      };
    }
  }, []);

  function registerListeners(socket) {
    if (listenersReadyRef.current) return;
    listenersReadyRef.current = true;

    socket.on("live-started", (session) => {
      setActiveSessions((prev) =>
        prev.find((s) => s.sessionId === session.sessionId) ? prev : [...prev, session]
      );
    });

    socket.on("live-ended", ({ sessionId }) => {
      setActiveSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      if (liveRoomRef.current?.sessionId === sessionId) {
        cleanupPeerConnections();
        setLiveRoom(null);
        setParticipants([]);
        setRaisedHands([]);
        setStreamActive(false);
      }
    });

    socket.on("rtmp-stream-active", ({ sessionId }) => {
      if (liveRoomRef.current?.sessionId === sessionId) {
        setStreamActive(true);
        setLiveRoom((prev) => prev ? { ...prev, streamActive: true } : prev);
      }
      setActiveSessions((prev) => prev.map((s) => s.sessionId === sessionId ? { ...s, streamActive: true } : s));
    });

    socket.on("rtmp-stream-ended", ({ sessionId }) => {
      if (liveRoomRef.current?.sessionId === sessionId) {
        setStreamActive(false);
        setLiveRoom((prev) => prev ? { ...prev, streamActive: false } : prev);
      }
      setActiveSessions((prev) => prev.map((s) => s.sessionId === sessionId ? { ...s, streamActive: false } : s));
    });

    socket.on("viewer-joined", async ({ userId }) => {
      const room = liveRoomRef.current;
      if (!room?.isBroadcaster || !myStreamRef.current) return;
      try {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        peerConnectionsRef.current[userId] = pc;
        myStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, myStreamRef.current));
        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit("signal", { to: userId, signal: { type: "candidate", candidate: e.candidate } });
        };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("signal", { to: userId, signal: offer });
      } catch (err) {
        console.error("viewer-joined error:", err);
      }
    });

    socket.on("viewer-left", ({ userId }) => {
      const pc = peerConnectionsRef.current[userId];
      if (pc) { pc.close(); delete peerConnectionsRef.current[userId]; }
    });

    socket.on("signal", async ({ from, signal }) => {
      try {
        if (signal.type === "offer") {
          const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
          peerConnectionsRef.current[from] = pc;
          pc.onicecandidate = (e) => {
            if (e.candidate) socket.emit("signal", { to: from, signal: { type: "candidate", candidate: e.candidate } });
          };
          pc.ontrack = (e) => {
            const remoteStream = new MediaStream();
            e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
            myStreamRef.current = remoteStream;
            setLiveRoom((prev) => (prev ? { ...prev, stream: remoteStream } : prev));
          };
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", { to: from, signal: answer });
        } else if (signal.type === "answer") {
          const pc = peerConnectionsRef.current[from];
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.type === "candidate") {
          const pc = peerConnectionsRef.current[from];
          if (pc && signal.candidate) await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.error("signal error:", err);
      }
    });

    socket.on("live-notification", (notif) => {
      setLiveNotifs((prev) => [...prev, { ...notif, id: Date.now() }]);
      setTimeout(() => setLiveNotifs((prev) => prev.filter((n) => n.id !== notif.id)), 6000);
    });

    socket.on("viewer-count", ({ count }) => {
      setLiveRoom((prev) => (prev ? { ...prev, viewerCount: count } : prev));
    });

    socket.on("incoming-call", ({ from, signal, type }) => {
      callPendingOfferRef.current = { from, signal, type };
      setCallState({
        status: "ringing",
        from,
        type,
        stream: null,
        remoteStream: null,
        pc: null,
      });
    });

    socket.on("call-answered", async ({ from, signal }) => {
      const pc = callPCRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        setCallState((prev) => ({ ...prev, status: "connected" }));
      }
    });

    socket.on("ice-candidate", async ({ from, candidate }) => {
      const pc = callPCRef.current;
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("call-ended", () => { cleanupCall(); });
    socket.on("call-declined", () => {
      cleanupCall();
      setCallState({ status: "declined" });
      setTimeout(() => setCallState({ status: "idle" }), 2000);
    });

    socket.on("participants-update", ({ participants: p, raisedHands: r }) => {
      setParticipants(p || []);
      setRaisedHands(r || []);
    });

    socket.on("mic-granted", async ({ sessionId }) => {
      const room = liveRoomRef.current;
      if (!room) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        speakerPCRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit("speaker-signal", { sessionId, to: room.broadcasterId, signal: { type: "candidate", candidate: e.candidate } });
        };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("speaker-signal", { sessionId, to: room.broadcasterId, signal: offer });
      } catch (err) {
        console.error("mic-granted error:", err);
      }
    });

    socket.on("mic-revoked", () => {
      if (speakerPCRef.current) {
        speakerPCRef.current.close();
        speakerPCRef.current = null;
      }
    });

    socket.on("muted-by-host", () => {
      if (myStreamRef.current) {
        myStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = false; });
      }
    });

    socket.on("unmuted-by-host", () => {
      if (myStreamRef.current) {
        myStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = true; });
      }
    });

    socket.on("speaker-signal", async ({ from, signal }) => {
      const room = liveRoomRef.current;
      if (!room?.isBroadcaster) return;
      try {
        if (signal.type === "offer") {
          const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
          speakerPCRef.current = pc;
          pc.onicecandidate = (e) => {
            if (e.candidate) socket.emit("speaker-signal", { sessionId: room.sessionId, to: from, signal: { type: "candidate", candidate: e.candidate } });
          };
          pc.ontrack = (e) => {
            const speakerStream = new MediaStream();
            e.streams[0].getTracks().forEach((t) => speakerStream.addTrack(t));
            setLiveRoom((prev) => prev ? { ...prev, speakerStreams: { ...prev.speakerStreams, [from]: speakerStream } } : prev);
          };
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("speaker-signal", { sessionId: room.sessionId, to: from, signal: answer });
        } else if (signal.type === "answer") {
          const pc = speakerPCRef.current;
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.type === "candidate") {
          const pc = speakerPCRef.current;
          if (pc && signal.candidate) await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.error("speaker-signal error:", err);
      }
    });
  }

  function cleanupCall() {
    callPendingOfferRef.current = null;
    const pc = callPCRef.current;
    if (pc) { pc.close(); callPCRef.current = null; }
    if (callMissedTimeoutRef.current) {
      clearTimeout(callMissedTimeoutRef.current);
      callMissedTimeoutRef.current = null;
    }
    callStartTimeRef.current = null;
    setCallState((prev) => {
      if (prev.stream) prev.stream.getTracks().forEach((t) => t.stop());
      return { status: "idle" };
    });
  }

  function unregisterListeners(socket) {
    const events = ["live-started", "live-ended", "viewer-joined", "viewer-left", "signal", "live-notification", "viewer-count", "incoming-call", "call-answered", "ice-candidate", "call-ended", "call-declined", "participants-update", "mic-granted", "mic-revoked", "muted-by-host", "unmuted-by-host", "speaker-signal", "rtmp-stream-active", "rtmp-stream-ended"];
    events.forEach((e) => socket.off(e));
  }

  const startRecording = useCallback(() => {
    const stream = myStreamRef.current;
    if (!stream || mediaRecorderRef.current) return;
    try {
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onerror = () => {
        if (recorder.state !== "inactive") recorder.stop();
        setIsRecording(false);
      };
      recorder.onstop = () => {
        const chunks = recordedChunksRef.current;
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `live-recording-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        recordedChunksRef.current = [];
        mediaRecorderRef.current = null;
      };
      recorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      setIsRecording(false);
    }
  }, []);

  const cleanupPeerConnections = useCallback(() => {
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};
    if (speakerPCRef.current) {
      speakerPCRef.current.close();
      speakerPCRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (myStreamRef.current) {
      myStreamRef.current.getTracks().forEach((t) => t.stop());
      myStreamRef.current = null;
    }
  }, []);

  const startLive = useCallback(async (data, existingStream) => {
    const socket = await waitForSocket(15000);
    const isRtmp = data.source === "rtmp";
    const stream = existingStream || (isRtmp ? null : await navigator.mediaDevices.getUserMedia({
      video: data.type === "video",
      audio: true,
    }));
    if (stream) myStreamRef.current = stream;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (stream && !existingStream) { stream.getTracks().forEach((t) => t.stop()); myStreamRef.current = null; }
        reject(new Error("Timed out starting live broadcast"));
      }, 10000);
      socket.emit("start-live", data, (res) => {
        clearTimeout(timeout);
        if (res?.success) {
          liveStartTimeRef.current = Date.now();
          setStreamActive(false);
          setLiveRoom({
            sessionId: res.sessionId,
            isBroadcaster: true,
            title: data.title,
            description: data.description,
            category: data.category,
            type: data.type,
            source: res.source || "browser",
            streamKey: res.streamKey,
            rtmpUrl: res.rtmpUrl,
            hlsUrl: res.hlsUrl,
            streamActive: false,
            startedAt: Date.now(),
            stream,
            viewerCount: 0,
            speakerStreams: {},
          });
          resolve(res);
        } else {
          if (stream && !existingStream) { stream.getTracks().forEach((t) => t.stop()); myStreamRef.current = null; }
          reject(new Error(res?.message || "Failed to start live"));
        }
      });
    });
  }, []);

  const joinLive = useCallback(async (session) => {
    const socket = getSocket();
    if (!socket) return;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const displayName = user.firstname && user.surname ? `${user.firstname} ${user.surname}` : `User-${(user._id || "").slice(-4)}`;
    socket.emit("join-live", { sessionId: session.sessionId, displayName });
    setStreamActive(!!session.streamActive);
    const isRtmp = session.source === "rtmp";
    myStreamRef.current = isRtmp ? null : new MediaStream();
    setLiveRoom({
      sessionId: session.sessionId,
      isBroadcaster: false,
      broadcasterId: session.broadcasterId,
      title: session.title,
      type: session.type,
      source: session.source || "browser",
      hlsUrl: session.hlsUrl,
      streamActive: !!session.streamActive,
      stream: myStreamRef.current,
      viewerCount: 0,
      speakerStreams: {},
    });
  }, []);

  const fetchAndJoinLive = useCallback(async (sessionId) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("get-session-info", { sessionId }, (session) => {
      if (!session) return;
      joinLive(session);
    });
  }, [joinLive]);

  const handleLeaveLive = useCallback(() => {
    const socket = getSocket();
    const room = liveRoomRef.current;
    if (room) {
      const elapsed = liveStartTimeRef.current ? Date.now() - liveStartTimeRef.current : 0;
      const mins = Math.floor(elapsed / 60000);
      const hrs = Math.floor(mins / 60);
      let duration = "";
      if (hrs > 0) duration = `${hrs}h ${mins % 60}m`;
      else if (mins > 0) duration = `${mins} min`;
      else duration = "less than a minute";
      setLiveEndedNotif(`Your live video ended — ${duration} ago`);
      liveStartTimeRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (room?.isBroadcaster) {
      socket?.emit("end-live", { sessionId: room.sessionId });
    } else if (room?.sessionId) {
      socket?.emit("leave-live", { sessionId: room.sessionId });
    }
    cleanupPeerConnections();
    setLiveRoom(null);
    setParticipants([]);
    setRaisedHands([]);
    setStreamActive(false);
  }, [cleanupPeerConnections]);

  const sendMessage = useCallback((text) => {
    const socket = getSocket();
    const room = liveRoomRef.current;
    if (socket && room) socket.emit("live-message", { sessionId: room.sessionId, text });
  }, []);

  const sendReaction = useCallback((emoji) => {
    const socket = getSocket();
    const room = liveRoomRef.current;
    if (socket && room) socket.emit("live-reaction", { sessionId: room.sessionId, emoji });
  }, []);

  const dismissLiveNotif = useCallback((id) => {
    setLiveNotifs((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const startCall = useCallback(async (userId, type) => {
    const socket = getSocket();
    if (!socket) return;
    const stream = await navigator.mediaDevices.getUserMedia({ video: type === "video", audio: true });
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    callPCRef.current = pc;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit("ice-candidate", { to: userId, candidate: e.candidate });
    };
    pc.ontrack = (e) => {
      const remoteStream = new MediaStream();
      e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      setCallState((prev) => ({ ...prev, remoteStream }));
    };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("call-user", { to: userId, signal: offer, type });
    callStartTimeRef.current = Date.now();
    callMissedTimeoutRef.current = setTimeout(() => {
      socket.emit("missed-call", { to: userId, callType: type });
      cleanupCall();
    }, 45000);
    setCallState({ status: "calling", to: userId, type, stream, remoteStream: null, pc });
  }, []);

  const acceptCall = useCallback(async () => {
    const socket = getSocket();
    const pending = callPendingOfferRef.current;
    if (!socket || !pending) return;
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      callPCRef.current = pc;
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit("ice-candidate", { to: pending.from, candidate: e.candidate });
      };
      pc.ontrack = (e) => {
        const remoteStream = new MediaStream();
        e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
        setCallState((prev) => ({ ...prev, remoteStream }));
      };
      await pc.setRemoteDescription(new RTCSessionDescription(pending.signal));
      const stream = await navigator.mediaDevices.getUserMedia({ video: pending.type === "video", audio: true });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer-call", { to: pending.from, signal: answer });
      callStartTimeRef.current = Date.now();
      if (callMissedTimeoutRef.current) {
        clearTimeout(callMissedTimeoutRef.current);
        callMissedTimeoutRef.current = null;
      }
      callPendingOfferRef.current = null;
      setCallState((prev) => ({ ...prev, status: "connected", stream, pc }));
    } catch (err) {
      console.error("acceptCall error:", err);
      cleanupCall();
    }
  }, []);

  const declineCall = useCallback(() => {
    const s = getSocket();
    const state = callState;
    if (s && state.from) s.emit("call-declined", { to: state.from, callType: state.type });
    cleanupCall();
  }, [callState]);

  const endCall = useCallback(() => {
    const s = getSocket();
    const state = callState;
    const duration = callStartTimeRef.current ? Math.floor((Date.now() - callStartTimeRef.current) / 1000) : 0;
    if (s && (state.to || state.from)) s.emit("end-call", { to: state.to || state.from, callType: state.type, duration });
    cleanupCall();
  }, [callState]);

  const toggleCallMute = useCallback(() => {
    setCallState((prev) => {
      if (!prev.stream) return prev;
      const enabled = !prev.stream.getAudioTracks().every((t) => !t.enabled);
      prev.stream.getAudioTracks().forEach((t) => { t.enabled = !enabled; });
      return { ...prev, micMuted: enabled };
    });
  }, []);

  const raiseHand = useCallback(() => {
    const socket = getSocket();
    const room = liveRoomRef.current;
    if (socket && room) socket.emit("raise-hand", { sessionId: room.sessionId });
  }, []);

  const lowerHand = useCallback(() => {
    const socket = getSocket();
    const room = liveRoomRef.current;
    if (socket && room) socket.emit("lower-hand", { sessionId: room.sessionId });
  }, []);

  const grantMic = useCallback((userId) => {
    const socket = getSocket();
    const room = liveRoomRef.current;
    if (socket && room) socket.emit("grant-mic", { sessionId: room.sessionId, userId });
  }, []);

  const revokeMic = useCallback((userId) => {
    const socket = getSocket();
    const room = liveRoomRef.current;
    if (socket && room) socket.emit("revoke-mic", { sessionId: room.sessionId, userId });
  }, []);

  const muteParticipant = useCallback((userId) => {
    const socket = getSocket();
    const room = liveRoomRef.current;
    if (socket && room) socket.emit("mute-participant", { sessionId: room.sessionId, userId });
  }, []);

  const unmuteParticipant = useCallback((userId) => {
    const socket = getSocket();
    const room = liveRoomRef.current;
    if (socket && room) socket.emit("unmute-participant", { sessionId: room.sessionId, userId });
  }, []);

  const dismissLiveEndedNotif = useCallback(() => setLiveEndedNotif(null), []);

  useEffect(() => {
    if (!liveEndedNotif) return;
    const t = setTimeout(dismissLiveEndedNotif, 5000);
    return () => clearTimeout(t);
  }, [liveEndedNotif, dismissLiveEndedNotif]);

  return (
    <LiveContext.Provider
      value={{
        activeSessions,
        liveRoom,
        liveNotifs,
        callState,
        showGoLiveModal,
        setShowGoLiveModal,
        myStreamRef,
        peerConnectionsRef,
        startLive,
        joinLive,
        fetchAndJoinLive,
        handleLeaveLive,
        sendMessage,
        sendReaction,
        dismissLiveNotif,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        isRecording,
        startRecording,
        stopRecording,
        participants,
        raisedHands,
        raiseHand,
        lowerHand,
        grantMic,
        revokeMic,
        muteParticipant,
        unmuteParticipant,
        streamActive,
        toggleCallMute,
      }}>
      {children}
      {liveEndedNotif && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium animate-slideUp">
          <span>{liveEndedNotif}</span>
          <button onClick={dismissLiveEndedNotif} className="text-white/60 hover:text-white shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </LiveContext.Provider>
  );
}

export const useLive = () => useContext(LiveContext);
