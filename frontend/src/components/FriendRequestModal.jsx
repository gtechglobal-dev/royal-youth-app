import { useState } from "react";
import API from "../services/api";
import { Spinner } from "./Loaders";

function FriendRequestModal({ open, requests, onClose, onUpdate }) {
  const [loadingIds, setLoadingIds] = useState({});

  if (!open || requests.length === 0) return null;

  const handleAccept = async (id) => {
    setLoadingIds((prev) => ({ ...prev, [id]: "accepting" }));
    try {
      await API.put(`/friends/accept/${id}`);
      onUpdate();
    } catch {
      setLoadingIds((prev) => ({ ...prev, [id]: undefined }));
    }
  };

  const handleReject = async (id) => {
    setLoadingIds((prev) => ({ ...prev, [id]: "rejecting" }));
    try {
      await API.put(`/friends/reject/${id}`);
      onUpdate();
    } catch {
      setLoadingIds((prev) => ({ ...prev, [id]: undefined }));
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">Friend Requests</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {requests.length}
          </span>
        </div>
        <div className="overflow-y-auto px-5 py-3 space-y-3">
          {requests.map((req) => {
            const user = req.from;
            const loading = loadingIds[req._id];
            return (
              <div
                key={req._id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 overflow-hidden shrink-0">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold text-sm">
                      {(user?.firstname?.[0] || "?").toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.nickname ||
                      `${user?.firstname || ""} ${user?.surname || ""}`.trim() ||
                      "Unknown"}
                  </p>
                  {user?.branch && (
                    <p className="text-xs text-gray-400 truncate">{user.branch}</p>
                  )}
                </div>
                {loading === "accepting" ? (
                  <Spinner size="sm" />
                ) : (
                  <button
                    onClick={() => handleAccept(req._id)}
                    disabled={!!loading}
                    className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 shrink-0"
                  >
                    Accept
                  </button>
                )}
                {loading === "rejecting" ? (
                  <Spinner size="sm" />
                ) : (
                  <button
                    onClick={() => handleReject(req._id)}
                    disabled={!!loading}
                    className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-300 transition disabled:opacity-50 shrink-0"
                  >
                    Decline
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FriendRequestModal;
