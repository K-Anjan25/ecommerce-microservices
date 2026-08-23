const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "";

type Primitive = string | number | boolean | null | undefined;
type RequestConfig = {
  params?: object;
  headers?: Record<string, string>;
  responseType?: "blob";
};
type ApiResponse<T> = { data: T; status: number; headers: Headers };
type TokenPair = { accessToken: string; refreshToken: string };

export class HttpError<T = any> extends Error {
  response?: { status: number; data: T; headers: Headers };
  constructor(message: string, response?: { status: number; data: T; headers: Headers }) {
    super(message);
    this.name = "HttpError";
    this.response = response;
  }
}

let refreshRequest: Promise<TokenPair> | null = null;

const clearSession = () => {
  localStorage.removeItem("access-token");
  localStorage.removeItem("refresh-token");
};

const buildUrl = (path: string, params?: RequestConfig["params"]) => {
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith("//")) {
    throw new Error("Feature API calls must use relative URLs");
  }
  const base = API_BASE_URL
    ? new URL(API_BASE_URL, window.location.origin).href
    : window.location.origin;
  const url = new URL(path, base.endsWith("/") ? base : `${base}/`);
  Object.entries(params ?? {}).forEach(([key, raw]) => {
    const values = Array.isArray(raw) ? raw : [raw];
    values.forEach((value) => {
      if (value !== null && value !== undefined) url.searchParams.append(key, String(value));
    });
  });
  return url;
};

const parseResponse = async <T>(response: Response, responseType?: "blob"): Promise<T> => {
  if (responseType === "blob") return (await response.blob()) as T;
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return (await response.json()) as T;
  return (await response.text()) as T;
};

const rawRequest = async <T>(
  method: string,
  path: string,
  body?: unknown,
  config: RequestConfig = {},
  accessToken?: string | null
): Promise<ApiResponse<T>> => {
  const headers = new Headers(config.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const isForm = body instanceof FormData;
  if (isForm) headers.delete("Content-Type");
  else if (body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(buildUrl(path, config.params), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      credentials: "omit",
      redirect: "follow",
      signal: controller.signal,
    });
    const data = await parseResponse<T>(response, config.responseType);
    if (!response.ok) {
      const message = (data as any)?.message ?? `Request failed with status ${response.status}`;
      throw new HttpError(message, { status: response.status, data, headers: response.headers });
    }
    return { data, status: response.status, headers: response.headers };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new HttpError("Request timed out");
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
};

const refreshTokens = () => {
  if (refreshRequest) return refreshRequest;
  const token = localStorage.getItem("refresh-token");
  if (!token) return Promise.reject(new HttpError("Refresh token is missing"));
  refreshRequest = rawRequest<TokenPair>(
    "GET",
    "/user/token/refresh",
    undefined,
    { headers: { "refresh-token": `Bearer ${token}` } },
    null
  )
    .then((response) => response.data)
    .finally(() => { refreshRequest = null; });
  return refreshRequest;
};

const request = async <T>(method: string, path: string, body?: unknown, config: RequestConfig = {}) => {
  const token = localStorage.getItem("access-token");
  try {
    return await rawRequest<T>(method, path, body, config, token);
  } catch (error) {
    const authEntry = path.includes("/user/login") || path.includes("/user/token/refresh");
    if (!(error instanceof HttpError) || error.response?.status !== 401 || authEntry) throw error;
    try {
      const tokens = await refreshTokens();
      localStorage.setItem("access-token", tokens.accessToken);
      localStorage.setItem("refresh-token", tokens.refreshToken);
      return await rawRequest<T>(method, path, body, config, tokens.accessToken);
    } catch (refreshError) {
      clearSession();
      if (window.location.pathname !== "/login") window.location.assign("/login");
      throw refreshError;
    }
  }
};

export const api = {
  get: <T = any>(path: string, config?: RequestConfig) => request<T>("GET", path, undefined, config),
  post: <T = any>(path: string, body?: unknown, config?: RequestConfig) => request<T>("POST", path, body, config),
  put: <T = any>(path: string, body?: unknown, config?: RequestConfig) => request<T>("PUT", path, body, config),
  delete: <T = any>(path: string, config?: RequestConfig) => request<T>("DELETE", path, undefined, config),
};
