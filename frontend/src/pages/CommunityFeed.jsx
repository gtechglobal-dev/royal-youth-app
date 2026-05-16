import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import { optimizeImage } from "../utils/cloudinary";

function CommunityFeed() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);

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
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

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

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error("Notif error:", err);
    }
  };

  const markNotifRead = async () => {
    try {
      await API.put("/notifications/read");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Mark read error:", err);
    }
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
          <div className="flex items-center gap-3">
            <Link to="/messages" className="relative text-gray-500 hover:text-purple-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
            <div className="relative">
              <button onClick={() => { setShowNotif(!showNotif); if (!showNotif && unreadCount > 0) markNotifRead(); }} className="relative text-gray-500 hover:text-purple-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="font-semibold text-sm">Notifications</p>
                  </div>
                  {notifications.length === 0 && <p className="text-gray-400 text-sm text-center p-4">No notifications</p>}
                  {notifications.map((n) => (
                    <div key={n._id} className={`p-3 border-b border-gray-50 text-sm ${n.read ? "" : "bg-purple-50"}`}>
                      <p className="text-gray-700">
                        <span className="font-semibold">{n.fromUserId?.firstname}</span>
                        {n.type === "like" && " liked your post"}
                        {n.type === "comment" && " commented on your post"}
                        {n.type === "message" && " sent you a message"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

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
            <p className="font-semibold text-sm">{user.firstname} {user.surname}</p>
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
    </div>
  );
}

export default CommunityFeed;
