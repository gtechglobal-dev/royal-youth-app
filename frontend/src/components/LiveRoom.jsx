import { useState, useEffect, useRef } from "react";
import { useLive } from "../contexts/LiveContext";
import { getSocket } from "../services/socket";
import Hls from "hls.js";

const REACTIONS = ["❤️", "🙏", "👍", "🔥", "😍", "👏"];

export default function LiveRoom() {
  const {
    liveRoom, handleLeaveLive, sendMessage, sendReaction, myStreamRef,
    peerConnectionsRef, isRecording, startRecording, stopRecording,
    participants, raisedHands, raiseHand, lowerHand,
    grantMic, revokeMic, muteParticipant, unmuteParticipant,
    streamActive,
  } = useLive();

  const videoRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [elapsed, setElapsed] = useState("0:00");
  const [showReactions, setShowReactions] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [myHandRaised, setMyHandRaised] = useState(false);
  const chatRef = useRef(null);
  const containerRef = useRef(null);
  const reactionPickerRef = useRef(null);

    const [videoDebug, setVideoDebug] = useState("loading...");

  const room = liveRoom;
  const isBroadcaster = room?.isBroadcaster;
  const isAudio = room?.type === "audio";
  const isRtmp = room?.source === "rtmp";

  const hlsRef = useRef(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const currentUserId = JSON.parse(localStorage.getItem("user") || "{}")._id;

  const shareLink = () => {
    const url = `${window.location.origin}/live/${room?.sessionId}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };
  const myName = JSON.parse(localStorage.getItem("user") || "{}").firstname || "You";

  useEffect(() => {
    const el = videoRef.current;
    const stream = room?.stream || myStreamRef.current;
    const tracks = stream?.getVideoTracks();
    const track = tracks?.[0];
    const settings = track?.getSettings?.();
    const info = `ref:${!!myStreamRef.current} room.stream:${!!room?.stream} el:${!!el} tracks:${tracks?.length||0} enabled:${track?.enabled} state:${track?.readyState} w:${settings?.width||el?.videoWidth||0}h:${settings?.height||el?.videoHeight||0}`;
    setVideoDebug(info);
    if (el && stream) {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
        el.play().then(() => console.log("[LiveRoom] play OK")).catch((e) => console.warn("[LiveRoom] play FAILED:", e));
      }
    }
  }, [room?.stream, room?.sessionId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessage = (msg) => setMessages((prev) => [...prev, msg]);
    const handleReaction = (r) => {
      setReactions((prev) => [...prev, { ...r, id: Date.now() }]);
      setTimeout(() => setReactions((prev) => prev.slice(1)), 2000);
    };
    const handleViewerCount = ({ count }) => setViewerCount(count);
    const handleLiveEnded = () => handleLeaveLive();

    socket.on("live-message", handleMessage);
    socket.on("live-reaction", handleReaction);
    socket.on("viewer-count", handleViewerCount);
    socket.on("live-ended", handleLiveEnded);

    return () => {
      socket.off("live-message", handleMessage);
      socket.off("live-reaction", handleReaction);
      socket.off("viewer-count", handleViewerCount);
      socket.off("live-ended", handleLiveEnded);
    };
  }, [handleLeaveLive]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const sec = Math.floor((Date.now() - start) / 1000);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      setElapsed(`${m}:${s.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isRtmp || !videoRef.current || !room?.hlsUrl || !streamActive) return;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(room.hlsUrl);
      hls.attachMedia(videoRef.current);
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = room.hlsUrl;
    }
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [isRtmp, room?.hlsUrl, streamActive]);

  useEffect(() => {
    if (!showReactions) return;
    const handleClickOutside = (e) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target)) {
        setShowReactions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showReactions]);

  const toggleMute = () => {
    if (myStreamRef.current) {
      myStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = isMuted; });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (myStreamRef.current) {
      myStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = isVideoOn; });
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleReactionSelect = (emoji) => {
    sendReaction(emoji);
    setShowReactions(false);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput("");
  };

  const handleRaiseHand = () => {
    if (myHandRaised) {
      lowerHand();
    } else {
      raiseHand();
    }
    setMyHandRaised(!myHandRaised);
  };

  const isHost = (p) => p.role === "host";
  const isSpeaker = (p) => p.role === "speaker";
  const isMe = (p) => p.userId === currentUserId;

  if (!room) return null;

  const host = participants.find((p) => isHost(p)) || { displayName: "Host", userId: room.broadcasterId };
  const speakers = participants.filter((p) => isSpeaker(p));
  const listeners = participants.filter((p) => !isHost(p) && !isSpeaker(p));

  const ParticipantItem = ({ p }) => (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          isHost(p) ? "bg-yellow-500 text-black" : isSpeaker(p) ? "bg-green-500 text-white" : "bg-gray-600 text-white"
        }`}>
          {p.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {isMe(p) ? `${myName} (You)` : p.displayName}
            {p.muted && <span className="ml-1.5 text-gray-400">🔇</span>}
          </p>
          <p className="text-[10px] text-gray-400">
            {isHost(p) ? "Host" : isSpeaker(p) ? "Speaker" : "Listener"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {raisedHands.find((r) => r.userId === p.userId) && !isHost(p) && (
          <span className="text-sm" title="Hand raised">✋</span>
        )}
        {isBroadcaster && !isHost(p) && (
          <>
            {p.muted ? (
              <button onClick={() => unmuteParticipant(p.userId)} className="p-1 text-red-400 hover:text-red-300 text-xs" title="Unmute">🔇</button>
            ) : (
              <button onClick={() => muteParticipant(p.userId)} className="p-1 text-white/60 hover:text-white text-xs" title="Mute">🔊</button>
            )}
            {isSpeaker(p) ? (
              <button onClick={() => revokeMic(p.userId)} className="px-2 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded hover:bg-red-500/30" title="Remove mic">Revoke</button>
            ) : (
              <button onClick={() => grantMic(p.userId)} className="px-2 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded hover:bg-green-500/30" title="Give mic">Mic</button>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (isAudio) {
    return (
      <div ref={containerRef} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <div className="w-full max-w-lg max-h-[85vh] bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 rounded-2xl overflow-hidden flex flex-col">
          <div className="flex-1 flex flex-col overflow-hidden px-4 pt-6 pb-2 min-h-0">
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
              <span className="text-2xl font-bold text-black">{host.displayName.charAt(0).toUpperCase()}</span>
            </div>
            <h2 className="text-white font-bold text-lg">{room.title}</h2>
            <p className="text-gray-400 text-xs">{host.displayName} · {elapsed}</p>
            <div className="flex items-center justify-center gap-3 mt-2 text-xs text-gray-400">
              <span>{viewerCount} listening</span>
              <span className="w-1 h-1 rounded-full bg-gray-500" />
              <span>{participants.length} here</span>
            </div>
          </div>

          {speakers.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 px-1">Speaking</p>
              <div className="space-y-0.5">
                {speakers.map((p) => <ParticipantItem key={p.userId} p={p} />)}
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto min-h-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 px-1">Listeners</p>
            <div className="space-y-0.5">
              {listeners.map((p) => <ParticipantItem key={p.userId} p={p} />)}
              {listeners.length === 0 && (
                <p className="text-gray-600 text-xs text-center py-4">No one else is here yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center justify-center gap-3">
            {!isBroadcaster && (
              <button onClick={handleRaiseHand} className={`flex flex-col items-center gap-0.5 min-w-[64px] ${myHandRaised ? "text-yellow-400" : "text-white/60 hover:text-white"} transition`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
                <span className="text-[10px]">{myHandRaised ? "Lower" : "Hand"}</span>
              </button>
            )}
            <div ref={reactionPickerRef} className="relative">
              <button onClick={() => setShowReactions(!showReactions)} className="flex flex-col items-center gap-0.5 min-w-[64px] text-white/60 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-[10px]">React</span>
              </button>
              {showReactions && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 bg-gray-800 rounded-full px-3 py-2 shadow-lg border border-gray-700">
                  {REACTIONS.map((emoji) => (
                    <button key={emoji} onClick={() => handleReactionSelect(emoji)} className="text-2xl hover:scale-125 transition-transform">{emoji}</button>
                  ))}
                </div>
              )}
            </div>
            {isBroadcaster && (
              <button onClick={isRecording ? stopRecording : startRecording} className={`flex flex-col items-center gap-0.5 min-w-[64px] transition ${isRecording ? "text-red-500" : "text-white/60 hover:text-white"}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="6" fill="currentColor" stroke="currentColor" strokeWidth={2} /></svg>
                <span className="text-[10px]">{isRecording ? "Stop" : "Record"}</span>
              </button>
            )}
            <button onClick={shareLink} className="flex flex-col items-center gap-0.5 min-w-[64px] text-white/60 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              <span className="text-[10px]">{linkCopied ? "Copied!" : "Share"}</span>
            </button>
            <button onClick={() => setShowChat(!showChat)} className={`flex flex-col items-center gap-0.5 min-w-[64px] transition ${showChat ? "text-purple-400" : "text-white/60 hover:text-white"}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <span className="text-[10px]">Chat</span>
            </button>
            <button onClick={handleLeaveLive} className="flex flex-col items-center gap-0.5 min-w-[64px] text-red-400 hover:text-red-300 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              <span className="text-[10px]">Leave</span>
            </button>
          </div>
        </div>

        {showChat && (
          <div className="border-t border-white/10 bg-gray-900/95">
            <div ref={chatRef} className="h-32 overflow-y-auto px-4 py-2 space-y-1">
              {messages.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className="text-purple-400 font-semibold mr-1">{msg.userId?.slice(-6)}</span>
                  <span className="text-white/80">{msg.text}</span>
                </div>
              ))}
              {messages.length === 0 && <p className="text-gray-600 text-xs text-center py-4">No messages yet</p>}
            </div>
            <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-2 border-t border-white/10">
              <input type="text" id="liveChatInput" name="liveChatInput" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Send a message..." className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-full outline-none placeholder-gray-500" maxLength={200} />
              <button type="submit" disabled={!chatInput.trim()} className="p-2 text-purple-400 hover:text-purple-300 disabled:opacity-40">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        )}

        {reactions.map((r) => (
          <div key={r.id} className="absolute text-3xl pointer-events-none" style={{ bottom: `${20 + Math.random() * 40}%`, left: `${10 + Math.random() * 60}%`, animation: "float-up 2s ease-out forwards" }}>
            {r.emoji}
          </div>
        ))}
      </div>
    </div>
    );
  }

  if (isRtmp && isBroadcaster) {
    return (
      <div ref={containerRef} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <div className="w-full max-w-lg max-h-[85vh] bg-black rounded-2xl overflow-hidden flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center min-h-0">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${streamActive ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`}>
            {streamActive ? (
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <span className="text-3xl">📡</span>
            )}
          </div>
          <h2 className="text-white font-bold text-xl mb-2">{room.title}</h2>
          <p className="text-gray-400 text-sm mb-6">{streamActive ? "🔴 Stream is live via external software" : "⏳ Waiting for external stream..."}</p>
          {!streamActive && (
            <div className="bg-gray-900 rounded-xl p-5 w-full max-w-sm text-left space-y-3 mb-4">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">RTMP URL</p>
                <p className="text-white text-sm font-mono bg-gray-800 rounded-lg px-3 py-2 break-all">{room.rtmpUrl}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Stream Key</p>
                <p className="text-white text-sm font-mono bg-gray-800 rounded-lg px-3 py-2 break-all">{room.streamKey}</p>
              </div>
            </div>
          )}
          {streamActive && (
            <p className="text-gray-500 text-xs mb-4">The stream is now being broadcast to all viewers.</p>
          )}
        </div>
        <div className="px-4 py-3 border-t border-gray-800 flex justify-center flex-shrink-0">
          <button onClick={handleLeaveLive} className="bg-red-600 text-white text-sm font-bold px-6 py-2 rounded-full hover:bg-red-700 transition">End Stream</button>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="w-full max-w-5xl max-h-[90vh] bg-black rounded-2xl overflow-hidden flex flex-col">
        <div className="relative flex-1 min-h-0">
          <video ref={(el) => { videoRef.current = el; if (el) { const s = room?.stream || myStreamRef.current; if (s) el.srcObject = s; } }} autoPlay playsInline muted={isBroadcaster} className="absolute inset-0 w-full h-full object-contain bg-black" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 text-xs md:text-sm bg-yellow-300 text-black font-bold px-3 py-1.5 rounded-lg shadow-lg pointer-events-none">{videoDebug}</div>
        {!isVideoOn && isBroadcaster && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE
            </span>
            <span className="text-white/80 text-xs font-medium">{elapsed}</span>
            <span className="flex items-center gap-1 text-white/80 text-xs">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              {viewerCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isRecording && (
              <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> REC
              </span>
            )}
            <button onClick={handleLeaveLive} className="bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full hover:bg-red-700 transition">End</button>
          </div>
        </div>

        {isRtmp && !streamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="text-3xl">📡</span>
              </div>
              <p className="text-white text-lg font-semibold">Waiting for stream...</p>
              <p className="text-gray-400 text-sm mt-1">The broadcaster is setting up their streaming software.</p>
            </div>
          </div>
        )}
        {reactions.map((r) => (
          <div key={r.id} className="absolute text-3xl animate-bounce pointer-events-none" style={{ bottom: `${20 + Math.random() * 40}%`, left: `${10 + Math.random() * 60}%`, animation: "float-up 2s ease-out forwards" }}>
            {r.emoji}
          </div>
        ))}
      </div>

      <div className="bg-gray-900 flex flex-col" style={{ maxHeight: '40vh' }}>
        <div className="overflow-y-auto min-h-0 flex-shrink">
          {!showChat && !isRtmp && (
            <div className="px-4 py-2 border-b border-gray-800 overflow-x-auto">
              <p className="text-[10px] text-gray-500 mb-1.5">Participants ({participants.length})</p>
              <div className="flex gap-2">
                {participants.slice(0, 15).map((p) => (
                  <div key={p.userId} className="flex flex-col items-center gap-0.5 flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isHost(p) ? "bg-yellow-500 text-black" : isSpeaker(p) ? "bg-green-500 text-white" : "bg-gray-600 text-white"
                    }`}>
                      {p.displayName.charAt(0).toUpperCase()}
                      {raisedHands.find((r) => r.userId === p.userId) && <span className="absolute -top-1 -right-1 text-xs">✋</span>}
                    </div>
                    <span className="text-[8px] text-gray-400 truncate max-w-[50px]">{p.displayName.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isBroadcaster && !isRtmp && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 overflow-x-auto">
              <span className="text-[10px] text-gray-500 flex-shrink-0">Manage:</span>
              {participants.filter((p) => !isHost(p)).slice(0, 10).map((p) => (
                <div key={p.userId} className="flex items-center gap-1 bg-gray-800 rounded-full px-2 py-0.5 flex-shrink-0">
                  <span className="text-xs text-white truncate max-w-[60px]">{p.displayName.split(" ")[0]}</span>
                  <button onClick={() => muteParticipant(p.userId)} className="text-xs text-gray-400 hover:text-white">{p.muted ? "🔇" : "🔊"}</button>
                  {isSpeaker(p) ? (
                    <button onClick={() => revokeMic(p.userId)} className="text-[10px] text-red-400 hover:text-red-300">✕</button>
                  ) : (
                    <button onClick={() => grantMic(p.userId)} className="text-[10px] text-green-400 hover:text-green-300">🎤</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-800 relative flex-shrink-0">
          {!isBroadcaster && !isRtmp && (
            <button onClick={handleRaiseHand} className={`flex items-center justify-center min-w-[36px] h-9 transition ${myHandRaised ? "text-yellow-400" : "text-white/60 hover:text-white"}`} title="Raise hand">
              <span className="text-lg">{myHandRaised ? "✋" : "🤚"}</span>
            </button>
          )}
          <div ref={reactionPickerRef} className="relative">
            <button onClick={() => setShowReactions(!showReactions)} className="flex items-center justify-center min-w-[36px] h-9 text-white/60 hover:text-white" title="React">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
            {showReactions && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center gap-1 bg-gray-800 rounded-full px-3 py-2 shadow-lg border border-gray-700">
                {REACTIONS.map((emoji) => (
                  <button key={emoji} onClick={() => handleReactionSelect(emoji)} className="text-2xl hover:scale-125 transition-transform">{emoji}</button>
                ))}
              </div>
            )}
          </div>
          {isBroadcaster && (
            <>
              <button onClick={toggleMute} className="flex items-center justify-center min-w-[36px] h-9 text-white/60 hover:text-white">
                {isMuted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
              </button>
              {room.type === "video" && (
                <button onClick={toggleVideo} className="flex items-center justify-center min-w-[36px] h-9 text-white/60 hover:text-white">
                  {isVideoOn ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  )}
                </button>
              )}
              <button onClick={isRecording ? stopRecording : startRecording} className={`flex items-center justify-center min-w-[36px] h-9 transition ${isRecording ? "text-red-500" : "text-white/60 hover:text-white"}`} title={isRecording ? "Stop recording" : "Start recording"}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="6" fill="currentColor" stroke="currentColor" strokeWidth={2} /></svg>
              </button>
            </>
          )}
          <button onClick={shareLink} className="flex items-center justify-center min-w-[36px] h-9 text-white/60 hover:text-white" title="Share link">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
          <button onClick={() => setShowChat(!showChat)} className={`p-1.5 transition ml-auto ${showChat ? "text-purple-400" : "text-white/60 hover:text-white"}`} title="Chat">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </button>
        </div>

        {showChat && (
          <>
            <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-1 max-h-28">
              {messages.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className="text-purple-400 font-semibold mr-1">{msg.userId?.slice(-6)}</span>
                  <span className="text-white/80">{msg.text}</span>
                </div>
              ))}
              {messages.length === 0 && <p className="text-gray-600 text-xs text-center py-4">No messages yet</p>}
            </div>
            <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-2 border-t border-gray-800">
              <input type="text" id="liveChatInput" name="liveChatInput" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Send a message..." className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-full outline-none placeholder-gray-500" maxLength={200} />
              <button type="submit" disabled={!chatInput.trim()} className="p-2 text-purple-400 hover:text-purple-300 disabled:opacity-40">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
