import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import PostCard from "../components/PostCard";

function SinglePost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const userRes = await API.get("/auth/me");
            setCurrentUser(userRes.data);
            setIsLoggedIn(true);
          } catch {
            localStorage.removeItem("token");
          }
        }

        const postRes = await API.get(`/posts/public/${id}`);
        setPost(postRes.data);
        setCommentCount(postRes.data.comments?.length || 0);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("Post not found");
        } else {
          setError("Could not load post");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate]);

  const handleDelete = (postId) => {
    navigate("/dashboard");
  };

  const handleLike = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    try {
      const res = await API.put(`/posts/${post._id}/like`);
      setPost((prev) => ({ ...prev, likes: res.data.likes }));
    } catch (err) { console.error(err); }
  };

  const handleUnlike = async () => {
    if (!isLoggedIn) { navigate("/login"); return; }
    try {
      const res = await API.put(`/posts/${post._id}/unlike`);
      setPost((prev) => ({ ...prev, likes: res.data.likes }));
    } catch (err) { console.error(err); }
  };

  const isLiked = post?.likes?.some((id) => {
    if (typeof id === "string") return id === currentUser?._id;
    return id._id === currentUser?._id;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md w-full mx-4 text-center">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Post not found</h2>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <Link to="/dashboard" className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        {isLoggedIn ? (
          <PostCard
            post={post}
            currentUserId={currentUser?._id}
            onDelete={handleDelete}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex items-start gap-3">
              <Link to={`/member/${post.userId?._id}`}>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {post.userId?.profileImage ? (
                    <img src={post.userId.profileImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-purple-600 font-bold text-sm">
                      {post.userId?.firstname?.[0]}{post.userId?.surname?.[0]}
                    </span>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={`/member/${post.userId?._id}`} className="font-semibold text-sm hover:text-purple-600 whitespace-nowrap">
                      {post.userId?.firstname} {post.userId?.surname}
                    </Link>
                    {post.userId?.role && post.userId.role !== "member" && (
                      <span className="ml-1.5 text-[10px] font-medium text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded whitespace-nowrap">{post.userId.role === "youth_president" ? "Youth President" : post.userId.role === "admin" ? "Admin" : post.userId.role}</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs whitespace-nowrap">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <span className="text-gray-400 text-xs block truncate">{post.userId?.branch}</span>
                {post.imageUrl ? (
                  <>
                    <p className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{post.text}</p>
                    <img src={post.imageUrl} alt="Post" className="mt-3 rounded-lg max-h-96 w-full object-cover cursor-pointer" onClick={() => window.open(post.imageUrl, "_blank")} />
                  </>
                ) : (
                  <div className="mt-4 rounded-xl px-8 py-14 text-center flex items-center justify-center relative overflow-hidden w-full min-h-[160px]" style={{ backgroundColor: post.placardColor || "#000000" }}>
                    <div className="absolute inset-0 opacity-90" style={{ backgroundColor: post.placardColor || "#000000" }} />
                    <p className="text-white text-base font-bold leading-relaxed whitespace-pre-wrap relative z-10 max-w-2xl">{post.text}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={handleLike} className={`flex items-center gap-1 text-sm ${isLiked ? "text-purple-600" : "text-gray-500"} hover:text-purple-600`}>
                    <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post.likes?.length || 0}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {commentCount}
                  </button>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">
                    <Link to="/login" className="text-purple-600 font-semibold hover:underline">Login</Link> to like or comment on this post
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SinglePost;
