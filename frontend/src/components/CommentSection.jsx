import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { timeAgo } from "../utils/formatTime";
import { optimizeImage } from "../utils/cloudinary";
import EmojiPicker from "./EmojiPicker";
import ConfirmModal from "./ConfirmModal";
import { displayName } from "../utils/displayName";

function CommentSection({ postId, currentUserId, onCommentCountChange }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const loadComments = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await API.get(`/posts/${postId}`);
      setComments(res.data.comments || []);
      setLoaded(true);
    } catch (err) {
      console.error("Load comments error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await API.post(`/posts/${postId}/comment`, { text: text.trim() });
      setComments((prev) => [...prev, res.data]);
      setText("");
      if (onCommentCountChange) onCommentCountChange((c) => c + 1);
    } catch (err) {
      console.error("Comment error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!deleteTarget) return;
    try {
      await API.delete(`/posts/${postId}/comment/${deleteTarget}`);
      setComments((prev) => prev.filter((c) => c._id !== deleteTarget));
      if (onCommentCountChange) onCommentCountChange((c) => c - 1);
    } catch (err) {
      console.error("Delete comment error:", err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleLikeComment = async (commentId) => {
    const comment = comments.find((c) => c._id === commentId);
    if (!comment) return;
    const liked = comment.likes?.some((id) => {
      if (typeof id === "string") return id === currentUserId;
      return id._id === currentUserId || id.toString() === currentUserId;
    });
    try {
      const endpoint = liked
        ? `/posts/${postId}/comment/${commentId}/unlike`
        : `/posts/${postId}/comment/${commentId}/like`;
      const res = await API.put(endpoint);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, likes: res.data.likes } : c))
      );
    } catch (err) {
      console.error("Like comment error:", err);
    }
  };

  const handleReplySubmit = async (commentId) => {
    if (!replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const res = await API.post(`/posts/${postId}/comment/${commentId}/reply`, { text: replyText.trim() });
      const { reply, commentId: cid } = res.data;
      setComments((prev) =>
        prev.map((c) =>
          c._id === cid ? { ...c, replies: [...(c.replies || []), reply] } : c
        )
      );
      setReplyText("");
      setReplyingTo(null);
    } catch (err) {
      console.error("Reply error:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const startReply = (comment) => {
    const name = comment.userId?.firstname || "User";
    setReplyingTo(comment._id);
    setReplyText(`@${name} `);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {!loaded && !loading && (
        <button onClick={loadComments} className="text-purple-600 text-xs hover:underline mb-2">
          View comments
        </button>
      )}
      {loading && <p className="text-xs text-gray-400">Loading...</p>}
      {loaded && (
        <div className="space-y-3 mb-3 max-h-80 overflow-y-auto">
          {comments.length === 0 && <p className="text-xs text-gray-400">No comments yet</p>}
          {comments.map((comment) => {
            const isLiked = comment.likes?.some((id) => {
              if (typeof id === "string") return id === currentUserId;
              return id._id === currentUserId || id.toString() === currentUserId;
            });
            const likeCount = comment.likes?.length || 0;
            const replies = comment.replies || [];

            return (
              <div key={comment._id}>
                <div className="flex gap-2">
                  <Link to={`/member/${comment.userId?._id}`}>
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {comment.userId?.profileImage ? (
                        <img src={optimizeImage(comment.userId.profileImage, 48)} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="text-purple-600 font-bold text-[10px]">
                          {comment.userId?.firstname?.[0]}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 bg-gray-50 rounded-lg px-3 py-1.5">
                    <div className="flex items-center justify-between">
                      <Link to={`/member/${comment.userId?._id}`} className="font-semibold text-xs hover:text-purple-600">
                        {displayName(comment.userId)}
                      </Link>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-[10px]">{timeAgo(comment.createdAt)}</span>
                        {comment.userId?._id === currentUserId && (
                          <button onClick={() => setDeleteTarget(comment._id)} className="text-gray-400 hover:text-red-500">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">{comment.text}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <button onClick={() => handleLikeComment(comment._id)} className={`flex items-center gap-0.5 text-[11px] ${isLiked ? "text-purple-600" : "text-gray-400"} hover:text-purple-600`}>
                        <svg className="w-3.5 h-3.5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {likeCount > 0 && likeCount}
                      </button>
                      <button onClick={() => startReply(comment)} className={`flex items-center gap-0.5 text-[11px] ${replyingTo === comment._id ? "text-blue-600" : "text-gray-400"} hover:text-blue-600`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        {replies.length > 0 && replies.length}
                      </button>
                    </div>
                  </div>
                </div>
                {replyingTo === comment._id && (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleReplySubmit(comment._id); }}
                    className="flex gap-1 items-center mt-2 ml-9"
                  >
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      maxLength={500}
                      className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || sendingReply}
                      className="bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {sendingReply ? (
                        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : "Send"}
                    </button>
                    <button type="button" onClick={cancelReply} className="text-gray-400 hover:text-gray-600 text-xs">
                      Cancel
                    </button>
                  </form>
                )}
                {replies.length > 0 && (
                  <div className="ml-9 mt-2 space-y-2 border-l-2 border-gray-100 pl-3">
                    {replies.map((reply) => (
                      <div key={reply._id} className="flex gap-2">
                        <Link to={`/member/${reply.userId?._id}`}>
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {reply.userId?.profileImage ? (
                              <img src={optimizeImage(reply.userId.profileImage, 48)} alt="" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <span className="text-blue-600 font-bold text-[9px]">
                                {reply.userId?.firstname?.[0]}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 bg-blue-50 rounded-lg px-2.5 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <Link to={`/member/${reply.userId?._id}`} className="font-semibold text-[11px] hover:text-blue-600">
                              {displayName(reply.userId)}
                            </Link>
                            <span className="text-gray-400 text-[9px]">{timeAgo(reply.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 text-xs">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-1 items-center w-full">
        <EmojiPicker onEmojiSelect={(emoji) => setText((prev) => prev + emoji)} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          maxLength={500}
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {sending ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            "Send"
          )}
        </button>
      </form>
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteComment}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default CommentSection;
