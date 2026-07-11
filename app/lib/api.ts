// ─────────────────────────────────────────────────────
// API HELPER
//
// Instead of writing fetch("http://localhost:3001/...")
// everywhere, import this and use:
//
//   import { api } from "@/app/lib/api";
//
//   const data = await api.get("/api/auth/...");
//   const data = await api.post("/api/auth/login", { email, password });
// ─────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T = unknown>(
  method: Method,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

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
};
