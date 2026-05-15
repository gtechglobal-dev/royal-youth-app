import { useState, useEffect } from "react";
import API from "../services/api";

function ConversationList({ currentUserId, onSelect, selectedId, onMessageReceived }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await API.get("/messages/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error("Fetch conversations error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-bold text-lg">Messages</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
          </div>
        )}
        {!loading && conversations.length === 0 && (
          <p className="text-gray-400 text-sm text-center p-6">No conversations yet</p>
        )}
        {conversations.map((conv) => (
          <button
            key={conv._id}
            onClick={() => onSelect(conv)}
            className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-50 text-left ${
              selectedId === conv._id ? "bg-purple-50" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {conv.otherUser?.profileImage ? (
                <img src={conv.otherUser.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-purple-600 font-bold text-sm">
                  {conv.otherUser?.firstname?.[0]}{conv.otherUser?.surname?.[0]}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {conv.otherUser?.firstname} {conv.otherUser?.surname}
              </p>
              <p className="text-gray-500 text-xs truncate">
                {conv.lastSenderId?._id === currentUserId ? "You: " : ""}
                {conv.lastMessage || "Start chatting"}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ConversationList;
