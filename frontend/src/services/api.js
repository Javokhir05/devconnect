import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// attach the JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function errorMessage(err) {
  const data = err.response?.data;
  return data?.error || data?.errors?.join(". ") || "Something went wrong. Is the server running?";
}

export default api;