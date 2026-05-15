import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../services/api";
import ConversationList from "../components/ConversationList";
import ChatWindow from "../components/ChatWindow";

function DirectMessages() {
  const navigate = useNavigate();
  const location = useLocation();
  const sharedPost = location.state?.sharedPost || null;
  const [user, setUser] = useState(null);
  const [selectedConv, setSelectedConv] = useState(null);
  const [showList, setShowList] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data);
      } catch { navigate("/login"); }
    };
    fetchUser();
  }, [navigate]);

  const handleSelect = (conv) => {
    setSelectedConv(conv);
    setShowList(false);
    if (sharedPost) {
      window.history.replaceState({}, "", "/messages");
    }
  };

  const handleSendWithSharedPost = async (userId) => {
    try {
      const res = await API.get(`/messages/conversation/${userId}`);
      setSelectedConv(res.data);
      setShowList(false);
    } catch (err) {
      console.error("Get conversation error:", err);
    }
  };

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
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!showList && (
              <button onClick={() => setShowList(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <Link to="/community" className="text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors">
              &larr; Community
            </Link>
            <h1 className="text-lg font-bold text-purple-700">Messages</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {sharedPost && (
          <div className="m-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-semibold text-yellow-800">Sharing a post — select a conversation to send it to:</p>
            <p className="text-xs text-yellow-700 mt-1 truncate">{sharedPost.text}</p>
          </div>
        )}

        <div className="flex h-[calc(100vh-120px)] bg-white m-4 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className={`w-full lg:w-80 border-r border-gray-200 ${showList ? "block" : "hidden lg:block"}`}>
            <ConversationList
              currentUserId={user._id}
              onSelect={handleSelect}
              selectedId={selectedConv?._id}
            />
          </div>
          <div className={`flex-1 ${showList ? "hidden lg:block" : "block"}`}>
            {selectedConv ? (
              <ChatWindow
                conversation={selectedConv}
                currentUserId={user._id}
                sharedPost={sharedPost}
                onClose={() => setShowList(true)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>Select a conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DirectMessages;
