import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import Notification from "../components/Notification";
import { PageLoader } from "../components/Loaders";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notification, setNotification] = useState({ open: false, type: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <PageLoader />;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setNotification({ open: true, type: "error", message: "Please enter your email" });
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/auth/forgot-password", { email });
      setStep(2);
      setNotification({ open: true, type: "success", message: "OTP sent to your email" });
    } catch (err) {
      setNotification({ open: true, type: "error", message: err.response?.data?.message || "Failed to send OTP" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      setNotification({ open: true, type: "error", message: "Please fill all fields" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotification({ open: true, type: "error", message: "Passwords do not match" });
      return;
    }
    if (newPassword.length < 6) {
      setNotification({ open: true, type: "error", message: "Password must be at least 6 characters" });
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/auth/reset-password", { email, otp, newPassword });
      setNotification({ open: true, type: "success", message: "Password reset successful" });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setNotification({ open: true, type: "error", message: err.response?.data?.message || "Failed to reset password" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-memberBlue">Recover Password</h2>
          <p className="text-gray-600 text-sm mt-2">
            {step === 1 ? "Enter your email to receive OTP" : "Enter OTP and new password"}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOTP}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-memberBlue"
                placeholder="Enter your email"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 text-white p-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-memberBlue"
                placeholder="6-digit OTP"
                maxLength={6}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-memberBlue"
                placeholder="New password"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-memberBlue"
                placeholder="Confirm new password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 text-white p-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50"
            >
              {submitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          Remember password?{" "}
          <Link to="/login" className="text-memberBlue font-semibold hover:underline">
            Login
          </Link>
        </p>

        <Notification
          type={notification.type}
          message={notification.message}
          isOpen={notification.open}
          onClose={() => setNotification({ ...notification, open: false })}
        />
      </div>
    </div>
  );
}

export default ForgotPassword;