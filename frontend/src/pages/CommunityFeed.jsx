import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import { optimizeImage } from "../utils/cloudinary";
import ConfirmModal from "../components/ConfirmModal";
import { displayName, displayNameFull } from "../utils/displayName";
import LiveFeedSection from "../components/LiveFeedSection";
import GoLiveModal from "../components/GoLiveModal";
import LiveRoom from "../components/LiveRoom";
import { useLive } from "../contexts/LiveContext";

const linkifyText = (text) => {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline break-all">$1</a>');
};
import { connectSocket, getSocket } from "../services/socket";

function CommunityFeed() {
  const navigate = useNavigate();
  const { liveRoom, setShowGoLiveModal, showGoLiveModal } = useLive();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [expandedNotif, setExpandedNotif] = useState(null);
  const [showAllNotifs, setShowAllNotifs] = useState(false);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [availableSources, setAvailableSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [showAllFeeds, setShowAllFeeds] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data);
      } catch {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

   useEffect(() => {
     if (!user) return;
     fetchFeed(1, true);
     fetchNotifications();
   }, [user]);

   useEffect(() => {
     if (!user?._id) return;
     connectSocket();
     const socket = getSocket();
     if (!socket) return;

     const handleNewPost = (post) => {
       setPosts((prev) => [post, ...prev]);
     };

     const handlePostUpdated = (post) => {
       setPosts((prev) => prev.map((p) => (p._id === post._id ? post : p)));
     };

     const handlePostDeleted = ({ postId }) => {
       setPosts((prev) => prev.filter((p) => p._id !== postId));
     };

     socket.on("newPost", handleNewPost);
     socket.on("postUpdated", handlePostUpdated);
     socket.on("postDeleted", handlePostDeleted);

     return () => {
       socket.off("newPost", handleNewPost);
       socket.off("postUpdated", handlePostUpdated);
       socket.off("postDeleted", handlePostDeleted);
     };
   }, [user?._id]);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notifId = params.get("notif");
    if (notifId) {
      setShowNotif(true);
      setExpandedNotif(notifId);
      const url = new URL(window.location);
      url.searchParams.delete("notif");
      window.history.replaceState({}, "", url);
    }
  }, []);

  // Close notification dropdown when clicking/tapping outside, swipe left/right
  useEffect(() => {
    if (!showNotif) return;
    let startX = 0;
    const clickHandler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    const touchStartHandler = (e) => {
      startX = e.touches[0].clientX;
    };
    const touchEndHandler = (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      if (Math.abs(diff) > 60) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", clickHandler);
    document.addEventListener("touchstart", touchStartHandler);
    document.addEventListener("touchend", touchEndHandler);
    return () => {
      document.removeEventListener("mousedown", clickHandler);
      document.removeEventListener("touchstart", touchStartHandler);
      document.removeEventListener("touchend", touchEndHandler);
    };
  }, [showNotif]);

  useEffect(() => {
    fetchAvailableSources();
  }, []);

  const fetchAvailableSources = async () => {
    try {
      const res = await API.get("/feeds/available");
      setAvailableSources(res.data);
    } catch (err) {
      console.error("Available sources error:", err);
    }
    setSourcesLoading(false);
  };

  const handleFollowSource = async (sourceId) => {
    try {
      await API.post(`/feeds/follow/${sourceId}`);
      setAvailableSources((prev) => prev.map((s) => s.sourceId === sourceId ? { ...s, following: true } : s));
    } catch (err) { console.error(err); }
  };

  const handleUnfollowSource = async (sourceId) => {
    try {
      await API.delete(`/feeds/follow/${sourceId}`);
      setAvailableSources((prev) => prev.map((s) => s.sourceId === sourceId ? { ...s, following: false } : s));
    } catch (err) { console.error(err); }
  };

  const shuffledSources = useMemo(() => {
    const shuffled = [...availableSources];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [availableSources]);

  const fetchFeed = async (p = 1, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await API.get(`/posts/feed?page=${p}&limit=20`);
      if (reset) {
        setPosts(res.data.posts);
      } else {
        setPosts((prev) => [...prev, ...res.data.posts]);
      }
      setHasMore(res.data.hasMore);
      setPage(p);
    } catch (err) {
      console.error("Feed error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const updateBadge = (count) => {
    if (count > 0) { try { navigator.setAppBadge?.(count); } catch (_) {} } else { try { navigator.clearAppBadge?.(); } catch (_) {} }
    navigator.serviceWorker?.ready?.then(r => r.active?.postMessage({ type: "SET_BADGE", count })).catch(() => {});
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
      updateBadge(res.data.unreadCount);
    } catch (err) {
      console.error("Notif error:", err);
    }
  };

  const markNotifRead = async () => {
    try {
      await API.put("/notifications/read");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      updateBadge(0);
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => { const next = prev.filter(n => n._id !== id); updateBadge(next.filter(n => !n.read).length); return next; });
    } catch (err) { console.error(err); }
  };

  const handlePostCreated = useCallback((post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  const handleDeletePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  const handleShare = useCallback((post) => {
    // Navigate to DM with shared post info
    navigate("/messages", { state: { sharedPost: { _id: post._id, text: post.text, imageUrl: post.imageUrl } } });
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors">
            &larr; Dashboard
          </Link>
          <h1 className="text-lg font-bold text-purple-700">Community</h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowGoLiveModal(true)} className="p-2 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50" title="Go Live">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <Link to="/messages" className="relative p-2 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
            <div className="relative" ref={notifRef}>
              <button onClick={() => { setShowNotif(!showNotif); if (!showNotif) { if (unreadCount > 0) markNotifRead(); else updateBadge(0); } }} className="relative p-2 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-semibold text-sm">Notifications</p>
                    {notifications.length > 0 && <button onClick={() => setClearAllConfirm(true)} className="text-xs text-red-500 hover:underline">Clear all</button>}
                  </div>
                  {notifications.length === 0 && <p className="text-gray-400 text-sm text-center p-4">No notifications</p>}
                  {(showAllNotifs ? notifications : notifications.slice(0, 2)).map((n) => {
                    const isExpanded = expandedNotif === n._id;
                    return (
                      <div key={n._id} className={`text-sm ${n.read ? "" : "bg-purple-50"}`}>
                        <div className="p-3 border-b border-gray-50">
                          <div className="flex items-start gap-2 cursor-pointer hover:bg-gray-50" onClick={() => { if (n.type === "reminder") { setExpandedNotif(isExpanded ? null : n._id); } else { navigate(n.type === "message" ? "/messages" : n.type === "friend_request" || n.type === "friend_accept" ? "/dashboard" : `/dashboard?post=${n.referenceId}`); } }}>
                            <div className="flex-1 min-w-0">
                              {n.type === "reminder" ? (
                                <div>
                                  <p className={`truncate ${n.read ? "text-gray-600" : "text-gray-900 font-semibold"}`}><span className="font-semibold">Royal Youth Hub</span></p>
                                  {n.referenceId && <p className={`text-xs truncate ${n.read ? "text-gray-400" : "text-gray-500"}`}>{n.referenceId}</p>}
                                </div>
                              ) : (
                                <p className={`${n.read ? "text-gray-600" : "text-gray-900 font-semibold"}`}><span className="font-semibold">{displayName(n.fromUserId)}</span> {n.type === "like" ? "liked your post" : n.type === "comment" ? "commented on your post" : n.type === "friend_accept" ? "accepted your friend request" : n.type === "friend_request" ? "sent you a friend request" : "sent you a message"}</p>
                              )}
                            </div>
                            <button onClick={(e) => deleteNotif(n._id, e)} className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                          {isExpanded && n.image && (
                            <div className="mt-2">
                              <img src={n.image} alt="" className="w-full h-auto max-h-56 object-contain rounded-lg" loading="lazy" />
                            </div>
                          )}
                          {isExpanded && (
                            <div className="mt-2">
                              <p className="text-gray-500 text-sm whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: n.body ? linkifyText(n.body) : "No additional details" }} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {notifications.length > 2 && (
                    <button onClick={() => setShowAllNotifs(!showAllNotifs)} className="w-full p-2 text-purple-600 text-xs font-semibold hover:bg-gray-50">
                      {showAllNotifs ? "Show less" : `Show more (${notifications.length - 2} more)`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <LiveFeedSection user={user} />

      {/* Suggested Feeds */}
      {!sourcesLoading && availableSources.length > 0 && (
        <div className="bg-white border-b border-gray-200 p-4">
            <h3 onClick={() => setShowAllFeeds(!showAllFeeds)} className="text-sm font-bold text-gray-700 mb-3 cursor-pointer hover:text-purple-600 flex items-center gap-2">
              {showAllFeeds ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
              News, business, relationships, lifestyle...Follow for UPDATES
            </h3>
            {showAllFeeds ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {shuffledSources.map((s) => (
                  <div key={s.sourceId} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-purple-50 transition">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg">
                      {s.icon || s.label[0]}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 text-center truncate max-w-full">{s.label}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{s.category}</span>
                    {s.following ? (
                      <button onClick={() => handleUnfollowSource(s.sourceId)} className="mt-1 w-full text-[10px] bg-purple-100 text-purple-700 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-purple-200 transition">
                        Following
                      </button>
                    ) : (
                      <button onClick={() => handleFollowSource(s.sourceId)} className="mt-1 w-full text-[10px] bg-purple-600 text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-purple-700 transition">
                        Follow
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
                {shuffledSources.map((s) => (
                  <div key={s.sourceId} className="flex flex-col items-center gap-1.5 min-w-[130px] p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-purple-50 transition flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg">
                      {s.icon || s.label[0]}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 text-center truncate max-w-[130px]">{s.label}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{s.category}</span>
                    {s.following ? (
                      <button onClick={() => handleUnfollowSource(s.sourceId)} className="mt-1 w-full text-[10px] bg-purple-100 text-purple-700 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-purple-200 transition">
                        Following
                      </button>
                    ) : (
                      <button onClick={() => handleFollowSource(s.sourceId)} className="mt-1 w-full text-[10px] bg-purple-600 text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-purple-700 transition">
                        Follow
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
            {user.profileImage ? (
              <img src={optimizeImage(user.profileImage, 64)} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <span className="text-purple-600 font-bold text-sm">{user.firstname?.[0]}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{displayNameFull(user)}</p>
            <p className="text-gray-400 text-xs">{user.branch}</p>
          </div>
        </div>

        <CreatePost onPostCreated={handlePostCreated} />

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">No posts yet</p>
            <p className="text-sm">Be the first to share something!</p>
          </div>
        )}

        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            currentUserId={user._id}
            onDelete={handleDeletePost}
            onShare={handleShare}
          />
        ))}

        {hasMore && (
          <div className="text-center py-6">
            <button
              onClick={() => fetchFeed(page + 1)}
              disabled={loadingMore}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </main>
      <ConfirmModal
        open={clearAllConfirm}
        title="Clear All Notifications"
        message="Are you sure you want to delete all notifications? This action cannot be undone."
        onConfirm={() => { API.delete("/notifications/clear-all").then(() => { setNotifications([]); setUnreadCount(0); updateBadge(0); }).catch(() => {}); setClearAllConfirm(false); }}
        onCancel={() => setClearAllConfirm(false)}
      />

      {showGoLiveModal && <GoLiveModal onClose={() => setShowGoLiveModal(false)} />}
      {liveRoom && <LiveRoom />}
    </div>
  );
}

export default CommunityFeed;
