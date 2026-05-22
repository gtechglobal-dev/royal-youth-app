import { useRef, useEffect } from "react";
import { useLive } from "../contexts/LiveContext";

export default function CallRoom() {
  const { callState, endCall, declineCall } = useLive();
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const { status, stream, remoteStream, type } = callState;

  useEffect(() => {
    if (localRef.current && stream) localRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  if (status === "idle" || status === "declined") return null;

  const isCaller = status === "calling";
  const isRinging = status === "ringing";
  const isConnected = status === "connected";

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="relative flex-1 flex items-center justify-center bg-gray-900">
        {type === "video" && remoteStream ? (
          <video ref={remoteRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-white/60 text-sm">{isCallingText(status)}</p>
          </div>
        )}

        {type === "video" && stream && (
          <div className="absolute top-4 right-4 w-32 h-48 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
            <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        )}

        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isConnected ? "bg-green-600" : isRinging ? "bg-yellow-600 animate-pulse" : "bg-purple-600"
          } text-white`}>
            {isConnected ? "Connected" : isRinging ? "Ringing..." : isCaller ? "Calling..." : ""}
          </span>
        </div>

        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6">
          <button
            onClick={endCall}
            className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition shadow-lg"
          >
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function isCallingText(status) {
  switch (status) {
    case "calling": return "Calling...";
    case "ringing": return "Incoming call...";
    case "connected": return "Connected";
    default: return "";
  }
}
