import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Notification from "../components/Notification";

function AdminLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [notification, setNotification] = useState({ open: false, type: "", message: "" });

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/admin-login", credentials);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setNotification({ open: true, type: "success", message: "Admin Login Successful" });
      
      setTimeout(() => {
        navigate("/admin");
      }, 1500);
    } catch (error) {
      setNotification({ open: true, type: "error", message: "Invalid Admin Credentials" });
    }
  };

  const handleGoToAdmin = () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (token && user.role === "admin") {
      navigate("/admin");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setNotification({ open: false, type: "", message: "" });
  };

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isLoggedIn = token && user.role === "admin";

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold mb-2 text-adminBlue">Welcome Admin</h2>
        <p className="text-gray-500 mb-6">Royal Youth Portal</p>

        {isLoggedIn ? (
          <div className="space-y-4">
            <p className="text-green-600 font-semibold">You are logged in as Admin</p>
            <button
              onClick={handleGoToAdmin}
              className="w-full bg-adminBlue text-white p-3 rounded-lg font-semibold hover:bg-blue-800 transition"
            >
              Go to Admin Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-gray-500 text-white p-3 rounded-lg font-semibold hover:bg-gray-600 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="username"
                placeholder="Username"
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-adminBlue focus:outline-none"
                onChange={handleChange}
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-adminBlue focus:outline-none"
                onChange={handleChange}
              />

              <button
                type="submit"
                className="w-full bg-adminBlue text-white p-3 rounded-lg font-semibold hover:bg-blue-800 transition"
              >
                Login
              </button>
            </form>
          </>
        )}
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        isOpen={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
      />
    </div>
  );
}

export default AdminLogin;