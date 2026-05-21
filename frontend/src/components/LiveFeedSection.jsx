import { useLive } from "../contexts/LiveContext";
import { displayNameFull } from "../utils/displayName";
import { getSocket } from "../services/socket";
import { useState, useEffect } from "react";

export default function LiveFeedSection({ user }) {
  const { activeSessions, joinLive } = useLive();
  const [broadcasters, setBroadcasters] = useState({});

  useEffect(() => {
    if (activeSessions.length === 0) return;
    const ids = [...new Set(activeSessions.map((s) => s.broadcasterId))];
    const fetchUsers = async () => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit("get-active-sessions", (sessions) => {
        Promise.all(
          sessions.map(async (s) => {
            if (!broadcasters[s.broadcasterId]) {
              try {
                const API = (await import("../services/api")).default;
                const res = await API.get(`/auth/member/${s.broadcasterId}`);
                return { id: s.broadcasterId, data: res.data };
              } catch {}
            }
            return null;
          })
        ).then((results) => {
          const map = {};
          results.filter(Boolean).forEach((r) => {
            map[r.id] = r.data;
          });
          setBroadcasters((prev) => ({ ...prev, ...map }));
        });
      });
    };
    fetchUsers();
  }, [activeSessions]);

  if (!activeSessions || activeSessions.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </span>
        <h3 className="text-sm font-bold text-gray-700">Live Broadcasts</h3>
        <span className="text-[10px] text-gray-400 font-medium">({activeSessions.length} active)</span>
      </div>
      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin" style={{ scrollbarWidth: "thin" }}>
        {activeSessions.map((session) => {
          const b = broadcasters[session.broadcasterId];
          const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
          const mins = Math.floor(elapsed / 60);
          const secs = elapsed % 60;
          return (
            <div
              key={session.sessionId}
              className="min-w-[200px] flex-shrink-0 bg-gray-900 rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-purple-500 transition"
              onClick={() => joinLive(session)}
            >
              <div className="relative h-28 bg-gray-800 flex items-center justify-center">
                {session.type === "video" ? (
                  <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  {mins}:{secs.toString().padStart(2, "0")}
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {typeof session.viewers === "number" ? session.viewers : session.viewers?.length || 0}
                </div>
              </div>
              <div className="p-2.5 bg-white">
                <p className="text-xs font-bold text-gray-800 truncate">{session.title}</p>
                <p className="text-[10px] text-gray-500 truncate">{b ? displayNameFull(b) : "Loading..."}</p>
                <p className="text-[10px] text-purple-600 font-medium">{session.category}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
