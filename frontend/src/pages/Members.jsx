import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function Members() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await API.get("/auth/members");

      setMembers(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-10">
      <h2 className="text-2xl font-bold mb-6">Registered Members</h2>

      <div className="bg-white shadow rounded p-5">
        {members.map((member, index) => (
          <div
            key={member._id}
            onClick={() => navigate(`/member/${member._id}`)}
            className="border-b p-3 flex justify-between cursor-pointer hover:bg-gray-100"
          >
            <span>
              {index + 1}. {member.firstname} {member.surname}
            </span>

            <span className="text-gray-500">{member.membershipStatus}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Members;
