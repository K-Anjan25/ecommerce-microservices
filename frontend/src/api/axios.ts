import axios, { InternalAxiosRequestConfig } from "axios";

export const api = axios.create();

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access-token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);