import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "";

type TokenPair = { accessToken: string; refreshToken: string };
let refreshRequest: Promise<TokenPair> | null = null;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  allowAbsoluteUrls: false,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
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

const clearSession = () => {
  localStorage.removeItem("access-token");
  localStorage.removeItem("refresh-token");
};

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url ?? "";
    const isAuthEntry = requestUrl.includes("/user/login") || requestUrl.includes("/user/token/refresh");

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthEntry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const refreshToken = localStorage.getItem("refresh-token");
    if (!refreshToken) {
      clearSession();
      return Promise.reject(error);
    }

    try {
      // One refresh for a burst of concurrent 401s; every failed request waits
      // for the same promise and then retries with the same new access token.
      if (!refreshRequest) {
        refreshRequest = axios
          .get<TokenPair>(`${API_BASE_URL}/user/token/refresh`, {
            timeout: 15000,
            withCredentials: false,
            headers: { "refresh-token": `Bearer ${refreshToken}` },
          })
          .then((response) => response.data)
          .finally(() => { refreshRequest = null; });
      }

      const tokens = await refreshRequest;
      localStorage.setItem("access-token", tokens.accessToken);
      localStorage.setItem("refresh-token", tokens.refreshToken);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearSession();
      if (window.location.pathname !== "/login") window.location.assign("/login");
      return Promise.reject(refreshError);
    }
  }
);
