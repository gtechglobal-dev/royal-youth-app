import { useState, useEffect, useRef } from "react";
import { useLive } from "../contexts/LiveContext";
import { getSocket } from "../services/socket";

const EMOJIS = ["❤️", "🔥", "🙌", "👏", "😍", "😂", "🙏", "💯", "🎉", "✨"];

export default function LiveRoom() {
  const { liveRoom, handleLeaveLive, sendMessage, sendReaction, myStreamRef, peerConnectionsRef } = useLive();
  const videoRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsed, setElapsed] = useState("0:00");
  const chatRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (myStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = myStreamRef.current;
    }
  }, [liveRoom?.stream]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };
    const handleReaction = (r) => {
      setReactions((prev) => [...prev, { ...r, id: Date.now() }]);
      setTimeout(() => setReactions((prev) => prev.slice(1)), 2000);
    };
    const handleViewerCount = ({ count }) => setViewerCount(count);
    const handleLiveEnded = () => {
      handleLeaveLive();
    };

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

  const toggleMute = () => {
    if (myStreamRef.current) {
      myStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (myStreamRef.current) {
      myStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput("");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}?live=${liveRoom?.sessionId}`;
    if (navigator.share) {
      await navigator.share({ title: "Join my live broadcast!", url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (!liveRoom) return null;

  const isBroadcaster = liveRoom.isBroadcaster;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      <div className="relative flex-1 flex flex-col">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isBroadcaster}
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
        {!isVideoOn && isBroadcaster && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
            <span className="text-white/80 text-xs font-medium">{elapsed}</span>
            <span className="flex items-center gap-1 text-white/80 text-xs">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {viewerCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button
              onClick={handleLeaveLive}
              className="bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full hover:bg-red-700 transition"
            >
              End
            </button>
          </div>
        </div>

        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute text-3xl animate-bounce pointer-events-none"
            style={{
              bottom: `${20 + Math.random() * 40}%`,
              left: `${10 + Math.random() * 60}%`,
              animation: "float-up 2s ease-out forwards",
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      <div className="bg-gray-900 flex flex-col max-h-[40vh]">
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto px-4 py-2 space-y-1 max-h-48"
        >
          {messages.map((msg, i) => (
            <div key={i} className="text-sm">
              <span className="text-purple-400 font-semibold mr-1">{msg.userId?.slice(-6)}</span>
              <span className="text-white/90">{msg.text}</span>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-gray-500 text-xs text-center py-4">No messages yet</p>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-700">
          <button onClick={() => sendReaction(EMOJIS[Math.floor(Math.random() * EMOJIS.length)])} className="p-1.5 text-white/70 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {isBroadcaster && (
            <>
              <button onClick={toggleMute} className="p-1.5 text-white/70 hover:text-white">
                {isMuted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              {liveRoom.type === "video" && (
                <button onClick={toggleVideo} className="p-1.5 text-white/70 hover:text-white">
                  {isVideoOn ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  )}
                </button>
              )}
            </>
          )}
          <button onClick={toggleFullscreen} className="p-1.5 text-white/70 hover:text-white ml-auto">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-2 border-t border-gray-700">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Send a message..."
            className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-full outline-none placeholder-gray-500"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2 text-purple-400 hover:text-purple-300 disabled:opacity-40"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
