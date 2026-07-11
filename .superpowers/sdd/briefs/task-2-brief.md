# Task 2: Enhance API Helper with Auto Auth Header and Token Refresh

**File to modify:** `app/lib/api.ts`

**Interfaces:**
- Consumes: `ENDPOINTS` from `@/app/lib/endpoints`
- Produces: Same `api` object (get, post, put, patch, delete) — now auto-attaches Authorization header and retries on 401

**Global Constraints:**
- ENDPOINTS.auth.refresh = '/api/auth/refresh'
- ENDPOINTS.auth.login = '/api/auth/login'
- Must NOT retry 401 on login or refresh endpoints (would cause infinite loop)
- Use a promise lock to prevent concurrent refresh calls
- On failed refresh: clear localStorage, redirect via `window.location.href = "/login"`

**Implementation:**

Replace the ENTIRE content of `app/lib/api.ts` with:

```ts
import { ENDPOINTS } from "@/app/lib/endpoints";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

let refreshPromise: Promise<boolean> | null = null;

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

async function request<T = unknown>(
  method: Method,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${BASE_URL}${path}`;

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

  if (res.status === 401 && path !== ENDPOINTS.auth.login && path !== ENDPOINTS.auth.refresh) {
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
};
```

**After modifying the file:**
- Run `npx tsc --noEmit` to verify no TypeScript errors
- Commit: `git add app/lib/api.ts && git commit -m "feat: add auto auth header and 401 token refresh to API helper"`
