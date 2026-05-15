import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import CommentSection from "./CommentSection";
import { timeAgo } from "../utils/formatTime";
import siteLogo from "../assets/gdev logo.svg";

const PLACARD_COLORS = [
  "#000000", "#1a1a2e", "#16213e", "#0f3460", "#533483",
  "#6a0572", "#9b2226", "#bb3e03", "#ca6702", "#ee9b00",
  "#2d6a4f", "#1b4332", "#005f73", "#0a9396", "#264653",
  "#2a9d8f", "#8ecae6", "#4a4e69", "#6c584c", "#7f5539",
];

function PostCard({ post, currentUserId, onDelete, onShare }) {
  const [likes, setLikes] = useState(post.likes || []);
  const [showComments, setShowComments] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [postText, setPostText] = useState(post.text);
  const [placardColor, setPlacardColor] = useState(post.placardColor || "#000000");
  const [saving, setSaving] = useState(false);

  const isLiked = likes.some((id) => {
    if (typeof id === "string") return id === currentUserId;
    return id._id === currentUserId;
  });

  const likeCount = likes.length;
  const isOwner = post.userId?._id === currentUserId;
  const timestamp = timeAgo(post.createdAt);

  const handleLike = async () => {
    try {
      if (isLiked) {
        const res = await API.put(`/posts/${post._id}/unlike`);
        setLikes(res.data.likes);
      } else {
        const res = await API.put(`/posts/${post._id}/like`);
        setLikes(res.data.likes);
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await API.delete(`/posts/${post._id}`);
      if (onDelete) onDelete(post._id);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = () => {
    setEditText(postText);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditText("");
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const res = await API.put(`/posts/${post._id}`, { text: editText.trim(), placardColor });
      setPostText(res.data.text);
      setEditing(false);
    } catch (err) {
      console.error("Edit error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex items-start gap-3">
        <Link to={`/member/${post.userId?._id}`}>
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {post.userId?.profileImage ? (
              <img src={post.userId.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-purple-600 font-bold text-sm">
                {post.userId?.firstname?.[0]}{post.userId?.surname?.[0]}
              </span>
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <Link to={`/member/${post.userId?._id}`} className="font-semibold text-sm hover:text-purple-600">
                {post.userId?.firstname} {post.userId?.surname}
              </Link>
              <span className="text-gray-400 text-xs ml-2">{post.userId?.branch}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-xs">{timestamp}</span>
            </div>
          </div>
          {editing ? (
            <div className="mt-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full p-3 border border-purple-300 rounded-lg resize-none text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-2 font-medium">Background</p>
                <div className="flex flex-wrap gap-2">
                  {PLACARD_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPlacardColor(color)}
                      className={`w-7 h-7 rounded-full transition-all ${
                        placardColor === color
                          ? "ring-2 ring-purple-500 ring-offset-2 scale-110"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={saveEdit} disabled={saving || !editText.trim()} className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={cancelEdit} className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="mt-2 rounded-xl px-5 py-8 text-center flex items-center justify-center min-h-[120px] relative overflow-hidden"
              style={{
                backgroundColor: post.placardColor || "#000000",
                backgroundImage: `url("${siteLogo}")`,
                backgroundRepeat: "repeat",
                backgroundSize: "36px",
              }}
            >
              <div className="absolute inset-0 opacity-90" style={{ backgroundColor: post.placardColor || "#000000" }} />
              <p className="text-white text-base font-bold leading-relaxed whitespace-pre-wrap relative z-10">{postText}</p>
            </div>
          )}
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Post"
              className="mt-3 rounded-lg max-h-96 w-full object-cover cursor-pointer"
              onClick={() => window.open(post.imageUrl, "_blank")}
            />
          )}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <button onClick={handleLike} className={`flex items-center gap-1 text-sm ${isLiked ? "text-purple-600" : "text-gray-500"} hover:text-purple-600`}>
              <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likeCount}
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {commentCount}
            </button>
            <button onClick={() => onShare?.(post)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            <div className="flex-1" />
            {isOwner && !editing && (
              <div className="flex items-center gap-1">
                <button onClick={startEdit} className="text-gray-400 hover:text-blue-500 p-1 rounded hover:bg-gray-100" title="Edit">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={handleDelete} disabled={deleting} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-100" title="Delete">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          {showComments && (
            <CommentSection
              postId={post._id}
              currentUserId={currentUserId}
              onCommentCountChange={setCommentCount}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PostCard;
