import { useLive } from "../contexts/LiveContext";

export default function LiveNotification() {
  const { liveNotifs, dismissLiveNotif, joinLive, activeSessions } = useLive();

  if (liveNotifs.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {liveNotifs.map((notif) => {
        const session = activeSessions.find((s) => s.sessionId === notif.sessionId);
        return (
          <div
            key={notif.id}
            className="bg-gray-900 text-white rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-slideUp cursor-pointer hover:bg-gray-800 transition"
            onClick={() => {
              if (session) joinLive(session);
              dismissLiveNotif(notif.id);
            }}
          >
            <span className="flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full mt-0.5">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{notif.title}</p>
              <p className="text-xs text-gray-400 truncate">just started a broadcast</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); dismissLiveNotif(notif.id); }}
              className="p-1 text-gray-500 hover:text-white shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
