import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await API.get(`/auth/verify/${token}`);
        setMessage(res.data.message);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch (error) {
        setMessage("Invalid or expired verification token");
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default VerifyEmail;