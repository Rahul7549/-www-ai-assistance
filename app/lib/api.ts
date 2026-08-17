import { ENDPOINTS } from "@/app/lib/endpoints";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

let refreshPromise: Promise<boolean> | null = null;

function isTokenExpiring(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" && payload.exp * 1000 < Date.now() + 60_000;
  } catch {
    return true;
  }
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return false;

  try {
    const url = `${BASE_URL}${ENDPOINTS.auth.refresh}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem("accessToken", data.data.accessToken);
    localStorage.setItem("refreshToken", data.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function handleRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

const AUTH_PATHS: Set<string> = new Set([ENDPOINTS.auth.login, ENDPOINTS.auth.refresh, ENDPOINTS.auth.register, ENDPOINTS.auth.logout]);

async function request<T = unknown>(
  method: Method,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const isAuthPath = AUTH_PATHS.has(path);

  if (!isAuthPath) {
    const token = localStorage.getItem("accessToken");
    if (token && isTokenExpiring(token)) {
      await handleRefresh();
    }
  }

  const buildHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  let res = await fetch(url, {
    method,
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !isAuthPath) {
    const refreshed = await handleRefresh();
    if (refreshed) {
      res = await fetch(url, {
        method,
        headers: buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      (error as { message?: string }).message ??
        `API ${method} ${path} failed (${res.status})`
    );
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>("GET", path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T = unknown>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T = unknown>(path: string) => request<T>("DELETE", path),
  upload: async <T = unknown>(path: string, formData: FormData): Promise<T> => {
    const url = `${BASE_URL}${path}`;
    const token = localStorage.getItem("accessToken");
    if (token && isTokenExpiring(token)) {
      await handleRefresh();
    }
    const buildHeaders = (): Record<string, string> => {
      const headers: Record<string, string> = {};
      const currentToken = localStorage.getItem("accessToken");
      if (currentToken) {
        headers["Authorization"] = `Bearer ${currentToken}`;
      }
      return headers;
    };

    let res = await fetch(url, { method: "POST", headers: buildHeaders(), body: formData });

    if (res.status === 401) {
      const refreshed = await handleRefresh();
      if (refreshed) {
        res = await fetch(url, { method: "POST", headers: buildHeaders(), body: formData });
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        throw new Error("Session expired");
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error((error as { message?: string }).message ?? `Upload failed (${res.status})`);
    }
    return res.json() as Promise<T>;
  },
};
