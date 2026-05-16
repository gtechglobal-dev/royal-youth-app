import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { optimizeImage } from "../utils/cloudinary";

function MemberProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchMember = async () => {
    const res = await API.get(`/auth/member/${id}`);
    setMember(res.data);
  };

  useEffect(() => {
    fetchMember();
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try { setCurrentUser(JSON.parse(userStr)); } catch {}
    }
  }, []);

  const updateStatus = async (status) => {
    await API.put(`/auth/member-status/${id}`, { status });
    fetchMember();
  };

  const handleSendMessage = async () => {
    try {
      const res = await API.get(`/messages/conversation/${id}`);
      navigate("/messages");
    } catch (err) {
      console.error("Error:", err);
    }
  };

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
            <p className="font-bold text-lg">{member.firstname} {member.surname}</p>
            <p className="text-gray-500 text-sm">{member.branch || "Plot C4/C5 Owerri"}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p><b>Phone:</b> {member.phone}</p>
          <p><b>Email:</b> {member.email}</p>
          <p><b>Occupation:</b> {member.occupation}</p>
          <p><b>Born Again:</b> {member.bornAgain}</p>
          <p><b>Status:</b> {member.membershipStatus}</p>
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
    </div>
  );
}

export default MemberProfile;
