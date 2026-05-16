import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import { optimizeImage } from "../utils/cloudinary";

function ChatWindow({ conversation, currentUserId, sharedPost, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const bottomRef = useRef(null);
  const topRef = useRef(null);

  const sharedSent = useRef(false);

  useEffect(() => {
    setMessages([]);
    setPage(1);
    sharedSent.current = false;
    fetchMessages(1, true);
  }, [conversation._id]);

  useEffect(() => {
    if (sharedPost && !sharedSent.current && messages.length > 0) {
      sharedSent.current = true;
      const sendShared = async () => {
        try {
          const form = new FormData();
          form.append("receiverId", conversation.otherUser._id);
          form.append("text", `Shared a post: "${sharedPost.text}"`);
          form.append("sharedPostId", sharedPost._id);
          const res = await API.post("/messages/send", form);
          setMessages((prev) => [...prev, res.data]);
        } catch (err) {
          console.error("Send shared post error:", err);
        }
      };
      sendShared();
    }
  }, [messages.length, sharedPost]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (conversation._id) {
        API.get(`/messages/${conversation._id}?page=1&limit=50`).then((res) => {
          setMessages(res.data.messages);
          setHasMore(res.data.hasMore);
        }).catch(() => {});
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [conversation._id]);

  const fetchMessages = async (p = 1, reset = false) => {
    setLoading(true);
    try {
      const res = await API.get(`/messages/${conversation._id}?page=${p}&limit=50`);
      if (reset) {
        setMessages(res.data.messages);
      } else {
        setMessages((prev) => [...res.data.messages, ...prev]);
      }
      setHasMore(res.data.hasMore);
      setPage(p);
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) fetchMessages(page + 1);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !image) return;

    setSending(true);
    try {
      const form = new FormData();
      form.append("receiverId", conversation.otherUser._id);
      if (text.trim()) form.append("text", text.trim());
      if (image) form.append("image", image);

      const res = await API.post("/messages/send", form);
      setMessages((prev) => [...prev, res.data]);
      setText("");
      setImage(null);
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setSending(false);
    }
  };

  const otherUser = conversation.otherUser;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
        <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {otherUser?.profileImage ? (
            <img src={optimizeImage(otherUser.profileImage, 48)} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-purple-600 font-bold text-xs">
              {otherUser?.firstname?.[0]}{otherUser?.surname?.[0]}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold text-sm">{otherUser?.firstname} {otherUser?.surname}</p>
          <p className="text-gray-400 text-xs">{otherUser?.branch}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {hasMore && (
          <button onClick={loadMore} disabled={loading} className="w-full text-purple-600 text-xs hover:underline">
            {loading ? "Loading..." : "Load older messages"}
          </button>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId?._id === currentUserId;
          return (
            <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${isMine ? "bg-purple-600 text-white" : "bg-white border border-gray-200"} rounded-xl px-4 py-2`}>
                {msg.text && <p className="text-sm">{msg.text}</p>}
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="" className="mt-1 rounded-lg max-h-48 cursor-pointer" onClick={() => window.open(msg.imageUrl, "_blank")} />
                )}
                {msg.sharedPostId && (
                  <div className="mt-1 bg-gray-50 border rounded p-2 text-xs text-gray-600">
                    <p className="font-semibold">Shared Post</p>
                    <p className="truncate">{msg.sharedPostId.text}</p>
                  </div>
                )}
                <p className={`text-[10px] mt-1 ${isMine ? "text-purple-200" : "text-gray-400"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
        {image && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">📷 Image attached</span>
            <button type="button" onClick={() => setImage(null)} className="text-red-500 text-xs">Remove</button>
          </div>
        )}
        <div className="flex gap-2">
          <label className="cursor-pointer text-gray-500 hover:text-purple-600 flex items-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setImage(e.target.files[0])} />
          </label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || (!text.trim() && !image)}
            className="bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatWindow;
