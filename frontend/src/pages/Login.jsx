import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Notification from "../components/Notification";

function Login() {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    identifier: "",
    password: "",
  });
  const [notification, setNotification] = useState({ open: false, type: "", message: "" });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/login", loginData);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setShowSuccess(true);
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Invalid login credentials";
      const isDeleted = error.response?.data?.accountDeleted;
      
      setNotification({ 
        open: true, 
        type: "error", 
        message: isDeleted 
          ? "Account Deleted: No longer a member of Royal Youth Community."
          : errorMsg 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-600">
              Login Successful
            </h2>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-xl font-bold mb-6 text-center text-memberBlue">
          Member Login
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            name="identifier"
            placeholder="Phone Number or Email"
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
            onChange={handleChange}
          />

          <button
            type="submit"
            className="w-full bg-memberBlue text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>

          <p className="text-center text-sm text-gray-600">
            Forgot Password?{" "}
            <span className="text-memberBlue font-semibold hover:underline cursor-pointer">
              Contact Admin
            </span>
          </p>
        </div>
      </form>

      <Notification
        type={notification.type}
        message={notification.message}
        isOpen={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
      />
    </div>
  );
}

export default Login;