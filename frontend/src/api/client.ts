import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      const { token, logout } = useAuthStore.getState();
      if (token) logout();
    }
    return Promise.reject(error);
  },
);

export function unwrapError(error: unknown, fallback = "Request failed"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    if (data?.detail) {
      if (typeof data.detail === "string") return data.detail;
      if (Array.isArray(data.detail) && data.detail.length > 0 && data.detail[0].msg) {
        return data.detail[0].msg;
      }
      return JSON.stringify(data.detail);
    }
    return error.message || fallback;
  }
  return fallback;
}
