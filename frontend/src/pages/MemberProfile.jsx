import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import PostCard from "../components/PostCard";
import { optimizeImage } from "../utils/cloudinary";
import { displayNameFull } from "../utils/displayName";

import { formatDate } from "../utils/formatTime";
import { Spinner } from "../components/Loaders";

function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const fetchMember = async () => {
    const res = await API.get(`/auth/member/${id}`);
    setMember(res.data);
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const res = await API.get(`/posts/user/${id}`);
      setPosts(res.data.posts);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchMember();
    fetchPosts();
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try { setCurrentUser(JSON.parse(userStr)); } catch {}
    }
  }, [id]);

  const updateStatus = async (status) => {
    await API.put(`/auth/member-status/${id}`, { status });
    fetchMember();
  };

  const handleSendMessage = async () => {
    try {
      await API.get(`/messages/conversation/${id}`);
      navigate("/messages");
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const handleDeletePost = useCallback((postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  }, []);

  const handleShare = useCallback((post) => {
    navigate("/messages", { state: { sharedPost: { _id: post._id, text: post.text, imageUrl: post.imageUrl } } });
  }, [navigate]);

  if (!member) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-10">
      <Link to="/dashboard" className="text-sky-600 hover:underline text-sm mb-4 inline-block">&larr; Back to Dashboard</Link>
      <h2 className="text-2xl font-bold mb-6">Member Profile</h2>

      <div className="bg-white shadow p-6 rounded w-full max-w-md">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
            {member.profileImage ? (
              <img src={optimizeImage(member.profileImage, 96)} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <span className="text-purple-600 font-bold text-xl">{member.firstname?.[0]}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-lg">{displayNameFull(member)}</p>
            <p className="text-gray-500 text-sm">{member.branch || "Plot C4/C5 Owerri"}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p><b>Phone:</b> {member.phone}</p>
          <p><b>Email:</b> {member.email}</p>
          <p><b>Occupation:</b> {member.occupation}</p>
          <p><b>Born Again:</b> {member.bornAgain}</p>
          <p><b>Status:</b> {member.membershipStatus}</p>
          <p><b>Last Seen:</b> <span className="text-gray-500">{member.lastLogin ? formatDate(member.lastLogin) : "Unknown"}</span></p>
          <p><b>State of Origin:</b> {member.stateOfOrigin || "N/A"}</p>
          <p><b>LGA:</b> {member.lga || "N/A"}</p>
          <p><b>Date Joined:</b> {formatDate(member.createdAt, true)}</p>
          <p><b>Role:</b> <span className={`font-medium ${
            member.role === "youth_president" ? "text-yellow-600" :
            member.role === "admin" ? "text-purple-600" : ""
          }`}>{member.role === "youth_president" ? "Youth President" : member.role === "admin" ? "Admin" : "Member"}</span></p>
        </div>

        <div className="mt-5 space-y-3">
          {currentUser?._id !== id && (
            <button
              onClick={handleSendMessage}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700"
            >
              Send Message
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 max-w-2xl">
        <h3 className="text-xl font-bold mb-4">Posts</h3>
        {postsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No posts yet</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={currentUser?._id}
                onDelete={handleDeletePost}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberProfile;
