import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

function MemberProfile() {
  const { id } = useParams();

  const [member, setMember] = useState(null);

  const fetchMember = async () => {
    const res = await API.get(`/auth/member/${id}`);
    setMember(res.data);
  };

  useEffect(() => {
    fetchMember();
  }, []);

  const updateStatus = async (status) => {
    await API.put(`/auth/member-status/${id}`, {
      status,
    });

    fetchMember();
  };

  if (!member) return <p>Loading...</p>;

  return (
    <div className="p-10">
      <h2 className="text-2xl font-bold mb-6">Member Profile</h2>

      <div className="bg-white shadow p-6 rounded w-96">
        <p>
          <b>Name:</b> {member.firstname} {member.surname}
        </p>

        <p>
          <b>Phone:</b> {member.phone}
        </p>

        <p>
          <b>Email:</b> {member.email}
        </p>

        <p>
          <b>Occupation:</b> {member.occupation}
        </p>

        <p>
          <b>Soulwinners Branch:</b> {member.branch || "Plot C4/C5 Owerri"}
        </p>

        <p>
          <b>Born Again:</b> {member.bornAgain}
        </p>

        <p>
          <b>Status:</b> {member.membershipStatus}
        </p>

        <div className="mt-5 flex gap-3">
          <button
            onClick={() => updateStatus("Active Member")}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Set Active
          </button>

          <button
            onClick={() => updateStatus("Inactive Member")}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Set Inactive
          </button>
        </div>
      </div>
    </div>
  );
}

export default MemberProfile;
