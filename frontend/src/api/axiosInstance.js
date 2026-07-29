import axios from "axios";
import { toast } from "react-toastify";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Prevents multiple simultaneous 401 responses from each independently
// triggering a redirect/toast -- only the FIRST one acts; the rest are
// no-ops until the page actually navigates away.
let isRedirectingToLogin = false;

axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error("Network error. Please check your connection and try again.");
      return Promise.reject(error);
    }

    const { status } = error.response;

    if (status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("user");

      if (window.location.pathname !== "/login" && !isRedirectingToLogin) {
        isRedirectingToLogin = true;
        toast.error("Your session has expired. Please log in again.");
        window.location.href = "/login";
      }
    } else if (status === 403) {
      toast.error("You do not have permission to perform this action.");
    } else if (status >= 500) {
      toast.error("Something went wrong on our end. Please try again shortly.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;