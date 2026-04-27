import axios from "axios";

const API = axios.create({
<<<<<<< HEAD
  baseURL: "http://localhost:5000/api",
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
=======
  baseURL: "http://royal-youth-app-backend.onrender.com",
>>>>>>> 9709aeb3ec7cd2e896e70aa5bd2bd1eea5e79288
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
      if (error.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/admin-login";
      }
    } else if (error.request) {
      console.error("Network Error:", error.message);
    } else {
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
