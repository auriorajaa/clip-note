import axios from "axios";

// const BASE_URL = "http://localhost:8080/api/v1";
const BASE_URL = `${process.env.BACKEND_URL}/api/v1`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't automatically logout on 401 - let the auth middleware handle it
    // The useRequireAuth hook will handle redirecting to login if needed
    return Promise.reject(error);
  },
);
