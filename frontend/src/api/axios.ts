import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access-token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh-token");
        if (refreshToken) {
          const response = await axios.get(`${API_BASE_URL}/user/token/refresh`, {
            headers: {
              "refresh-token": `Bearer ${refreshToken}`,
            },
          });

          const {
            accessToken,
            refreshToken: nextRefreshToken,
          } = response.data as { accessToken: string; refreshToken: string };

          localStorage.setItem("access-token", accessToken);
          localStorage.setItem("refresh-token", nextRefreshToken);
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem("access-token");
        localStorage.removeItem("refresh-token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
