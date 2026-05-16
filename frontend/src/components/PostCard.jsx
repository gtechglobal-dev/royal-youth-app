import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import CommentSection from "./CommentSection";
import { timeAgo } from "../utils/formatTime";
import siteLogo from "../assets/gdev logo.svg";
import { optimizeImage } from "../utils/cloudinary";

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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const shareUrl = `${window.location.origin}/post/${post._id}`;
  const shareText = `Check out this post from Royal Youth Hub: "${postText}"`;

  const shareToChat = () => {
    setShowShareMenu(false);
    onShare?.(post);
  };

  const shareToWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
    setShowShareMenu(false);
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, "_blank");
    setShowShareMenu(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowShareMenu(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex items-start gap-3">
        <Link to={`/member/${post.userId?._id}`}>
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {post.userId?.profileImage ? (
              <img src={optimizeImage(post.userId.profileImage, 64)} alt="" className="w-full h-full object-cover" loading="lazy" />
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
              {post.userId?.role && post.userId.role !== "member" && (
                <span className="ml-1.5 text-[10px] font-medium text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">{post.userId.role === "youth_president" ? "Youth President" : post.userId.role === "admin" ? "Admin" : post.userId.role}</span>
              )}
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
            <div className="relative">
              <button onClick={() => setShowShareMenu(!showShareMenu)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
              {showShareMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <button onClick={shareToChat} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      Send via Chat
                    </button>
                    <button onClick={shareToWhatsApp} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </button>
                    <button onClick={shareToFacebook} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Facebook
                    </button>
                    <button onClick={copyLink} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      {copied ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                </>
              )}
            </div>
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
