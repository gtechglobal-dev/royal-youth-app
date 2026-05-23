import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import { optimizeImage } from "../utils/cloudinary";
import { displayName } from "../utils/displayName";
import { useLive } from "../contexts/LiveContext";
import useEmojiFavorites from "../hooks/useEmojiFavorites";

const EMOJIS = ["😀","😁","😂","🤣","😊","😇","🙂","😉","😌","😍","🥰","😘","😗","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🥴","😵","🤯","🤠","🥳","🥺","😢","😭","😤","😠","😡","🤬","👋","🤚","🖐","✋","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦵","🦶","👂","🦻","👃","🧠","🦷","👀","👅","👄","❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","✨","🌟","⭐","🔥","💯","🎉","🎊","🎈","🎁","🎀","🪄","💎","👑","📿","🧧","🏆","🥇","🥈","🥉","⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱","🎮","🎯","🎲","♟️","🎸","🎺","🎻","🎹","🥁","🎤","🎧","📱","💻","⌚️","📷","🎥","📸","🔮","💡","🔦","📖","📚","📝","✂️","📍","📌","🔗","🧷","🎭","🎨","🧩","🌈","☀️","🌤","⛅️","🌧","⛈","🌩","❄️","🔥","💨","🌪","🌊","💧","🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌽","🥕","🧄","🧅","🥔","🍠","🫓","🥐","🥖","🫓","🥯","🍞","🥨","🧀","🥚","🍳","🥞","🧇","🥓","🥩","🍗","🍖","🦴","🌭","🍔","🍟","🍕","🥪","🥙","🧆","🌮","🌯","🥗","🥘","🫕","🥫","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🥮","🍥","🎂","🍰","🧁","🥧","🍦","🍨","🍧","🍩","🍪","🍫","🍬","🍭","🍮","🍯","☕️","🍵","🧃","🥤","🧊","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🍾","🥄","🥄","🍴","🥢","🍽","🥣"];

function ChatWindow({ conversation, currentUserId, sharedPost, onClose }) {
  const { startCall, callState } = useLive();
  const { trackUse, getFavorites } = useEmojiFavorites();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const bottomRef = useRef(null);
  const topRef = useRef(null);
  const emojiRef = useRef(null);

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

  useEffect(() => {
    if (!showEmojis) return;
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmojis(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojis]);

  const insertEmoji = (emoji) => {
    trackUse(emoji);
    setText((prev) => prev + emoji);
    setShowEmojis(false);
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
      <div className="px-2 py-2 md:px-4 md:py-3 border-b border-gray-200 flex items-center gap-1.5 md:gap-3 bg-white">
        <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700 shrink-0">
          <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {otherUser?.profileImage ? (
            <img src={optimizeImage(otherUser.profileImage, 48)} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-purple-600 font-bold text-[9px] md:text-xs">
              {otherUser?.firstname?.[0]}{otherUser?.surname?.[0]}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-xs md:text-sm truncate">{displayName(otherUser)}</p>
          <p className="text-gray-400 text-[10px] md:text-xs truncate">{otherUser?.branch}</p>
        </div>
        <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
          <button
            onClick={() => startCall(otherUser._id, "audio")}
            disabled={callState.status !== "idle"}
            className="p-1 md:p-2 text-gray-500 hover:text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-30 transition"
            title="Audio call"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.128-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 5V5z" />
            </svg>
          </button>
          <button
            onClick={() => startCall(otherUser._id, "video")}
            disabled={callState.status !== "idle"}
            className="p-1 md:p-2 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-30 transition"
            title="Video call"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
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
          if (msg.type === "call") {
            const icon = msg.callType === "video" ? "📹" : "📞";
            const label = msg.callStatus === "ended" ? "Call ended" : msg.callStatus === "declined" ? "Call declined" : "Missed call";
            const duration = msg.callDuration ? ` (${Math.floor(msg.callDuration / 60)}:${(msg.callDuration % 60).toString().padStart(2, "0")})` : "";
            return (
              <div key={msg._id} className="flex justify-center">
                <div className="bg-gray-100 rounded-full px-4 py-1.5 text-xs text-gray-500 flex items-center gap-1.5">
                  <span>{icon}</span>
                  <span>{label}{duration}</span>
                  <span className="text-gray-400">· {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            );
          }
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

      <form onSubmit={handleSend} className="px-2 py-2 md:px-4 md:py-3 border-t border-gray-200 bg-white">
        {image && (
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className="text-xs text-gray-500">📷 Image attached</span>
            <button type="button" onClick={() => setImage(null)} className="text-red-500 text-xs">Remove</button>
          </div>
        )}
        <div className="flex items-center gap-1 md:gap-2">
          <div ref={emojiRef} className="relative">
            <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="text-gray-500 hover:text-purple-600 flex items-center p-1 md:p-2 rounded-lg hover:bg-purple-50 shrink-0">
              <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showEmojis && (
              <div className="absolute bottom-full left-0 mb-2 w-72 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50">
                {getFavorites().length > 0 && (
                  <div className="grid grid-cols-8 gap-0.5 pb-1.5 mb-1.5 border-b border-gray-100">
                    {getFavorites().map((emoji) => (
                      <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className="text-lg hover:bg-gray-100 rounded p-0.5 transition">
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-8 gap-0.5">
                  {EMOJIS.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} className="text-lg hover:bg-gray-100 rounded p-0.5 transition">
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <label className="cursor-pointer text-gray-500 hover:text-purple-600 flex items-center p-1 md:p-2 rounded-lg hover:bg-purple-50 shrink-0">
            <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setImage(e.target.files[0])} />
          </label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 md:px-4 md:py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || (!text.trim() && !image)}
            className="bg-purple-600 text-white px-2 py-1.5 md:px-5 md:py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatWindow;
