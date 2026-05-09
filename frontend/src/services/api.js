import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 120000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error("API Error:", error.config?.url, error.response.status, error.response.data);

      // Don't redirect if we're on login pages or if it's a login request
      const isLoginRequest = error.config?.url?.includes("/login") || error.config?.url?.includes("/admin-login");
      const currentPath = window.location.pathname;
      const isOnLoginPage = currentPath === "/login" || currentPath === "/admin-login";

      if (error.response.status === 401 && !isLoginRequest && !isOnLoginPage) {
        console.log("401 error in interceptor - redirecting to login");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role === "admin") {
            window.location.href = "/admin-login";
          } else {
            window.location.href = "/login";
          }
        } else {
          window.location.href = "/login";
        }
      }
    } else if (error.request) {
      console.error("Network Error:", error.message);
    } else {
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  },
);

export default API;
