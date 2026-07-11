# Authentication & Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add client-side authentication with route protection so only logged-in users can access the chat and voice-assistance pages.

**Architecture:** React Context (`AuthProvider`) manages auth state (user, tokens) via localStorage. Protected pages live in an `(protected)` route group whose layout redirects unauthenticated users. The API helper auto-attaches JWT tokens and handles silent refresh on 401.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, localStorage for tokens, existing Express backend JWT auth

## Global Constraints

- No test framework exists — verify manually via dev server
- Use `@/*` path alias for cross-directory imports
- All components are client components (`"use client"`)
- Dark theme only — loading states use `bg-[#020617]` with indigo accents
- Use `app/lib/api.ts` for all backend calls, `app/lib/endpoints.ts` for paths
- Backend JWT payload shape: `{ userid: string, role: string, iat: number, exp: number }`

---

### Task 1: Create the Auth Context

**Files:**
- Create: `app/lib/auth-context.tsx`

**Interfaces:**
- Consumes: `api` from `@/app/lib/api`, `ENDPOINTS` from `@/app/lib/endpoints`
- Produces:
  - `AuthProvider` component (wraps children)
  - `useAuth()` hook returning `{ user: User | null, isLoading: boolean, login: (email: string, password: string) => Promise<void>, logout: () => Promise<void> }`
  - `User` type: `{ id: string, email: string, firstName: string, lastName: string }`

- [ ] **Step 1: Create `app/lib/auth-context.tsx`**

```tsx
"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";
import { ENDPOINTS } from "@/app/lib/endpoints";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return payload.exp * 1000 < Date.now();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken || !refreshToken) {
        setIsLoading(false);
        return;
      }

      if (!isTokenExpired(accessToken)) {
        const payload = decodeJwtPayload(accessToken);
        if (payload && typeof payload.userid === "string") {
          setUser({ id: payload.userid, email: "", firstName: "", lastName: "" });
        }
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.post<{
          success: boolean;
          data: { accessToken: string; refreshToken: string };
        }>(ENDPOINTS.auth.refresh, { refreshToken });

        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);

        const payload = decodeJwtPayload(res.data.accessToken);
        if (payload && typeof payload.userid === "string") {
          setUser({ id: payload.userid, email: "", firstName: "", lastName: "" });
        }
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }

      setIsLoading(false);
    };

    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{
      success: boolean;
      data: {
        user: { id: string; email: string; firstName: string; lastName: string };
        token: { accessToken: string; refreshToken: string };
      };
    }>(ENDPOINTS.auth.login, { email, password });

    localStorage.setItem("accessToken", res.data.token.accessToken);
    localStorage.setItem("refreshToken", res.data.token.refreshToken);

    setUser(res.data.user);
    router.replace("/");
  }, [router]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (refreshToken) {
        await api.post(ENDPOINTS.auth.logout, { refreshToken });
      }
    } catch {
      // Ignore errors — we clear tokens regardless
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty`
Expected: No errors related to `auth-context.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/lib/auth-context.tsx
git commit -m "feat: add AuthProvider and useAuth hook"
```

---

### Task 2: Enhance API Helper with Auto Auth Header and Token Refresh

**Files:**
- Modify: `app/lib/api.ts`

**Interfaces:**
- Consumes: `ENDPOINTS` from `@/app/lib/endpoints`
- Produces: Same `api` object (get, post, put, patch, delete) — now auto-attaches Authorization header and retries on 401

- [ ] **Step 1: Rewrite `app/lib/api.ts`**

Replace the entire file with:

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

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty`
Expected: No errors related to `api.ts`

- [ ] **Step 3: Commit**

```bash
git add app/lib/api.ts
git commit -m "feat: add auto auth header and 401 token refresh to API helper"
```

---

### Task 3: Wire AuthProvider into Root Layout

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `AuthProvider` from `@/app/lib/auth-context`
- Produces: All pages now have access to `useAuth()`

- [ ] **Step 1: Update `app/layout.tsx`**

Replace the entire file with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { AuthProvider } from "@/app/lib/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "Modern AI Assistant UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: wrap app with AuthProvider in root layout"
```

---

### Task 4: Create Protected Route Group Layout

**Files:**
- Create: `app/(protected)/layout.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `@/app/lib/auth-context`
- Produces: Layout that guards all child routes — redirects to `/login` if unauthenticated

- [ ] **Step 1: Create `app/(protected)/layout.tsx`**

```tsx
"use client";
import { useAuth } from "@/app/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#020617]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(protected)/layout.tsx
git commit -m "feat: add protected route group layout with auth guard"
```

---

### Task 5: Create Public-Only Auth Layout

**Files:**
- Create: `app/(auth)/layout.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `@/app/lib/auth-context`
- Produces: Layout that redirects logged-in users to `/`

- [ ] **Step 1: Create `app/(auth)/layout.tsx`**

```tsx
"use client";
import { useAuth } from "@/app/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#020617]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(auth)/layout.tsx"
git commit -m "feat: add auth route group layout redirecting logged-in users to /"
```

---

### Task 6: Move Pages into Protected Route Group

**Files:**
- Move: `app/page.tsx` → `app/(protected)/page.tsx`
- Move: `app/voice-assistance/page.tsx` → `app/(protected)/voice-assistance/page.tsx`
- Modify: `app/(protected)/page.tsx` (update imports to use `@/` path alias)
- Modify: `app/_components/ChatArea.tsx` (remove unused VoiceAssistant import)

**Interfaces:**
- Consumes: `Sidebar` from `@/app/_components/Sidebar`, `ChatArea` from `@/app/_components/ChatArea`
- Produces: Chat page at URL `/`, voice-assistance at URL `/voice-assistance` — both protected

- [ ] **Step 1: Create directories and move files**

```bash
mkdir -p "app/(protected)/voice-assistance"
mv app/page.tsx "app/(protected)/page.tsx"
mv app/voice-assistance/page.tsx "app/(protected)/voice-assistance/page.tsx"
rmdir app/voice-assistance
```

- [ ] **Step 2: Update imports in `app/(protected)/page.tsx`**

Replace the entire file with:

```tsx
import Sidebar from "@/app/_components/Sidebar";
import ChatArea from "@/app/_components/ChatArea";

export default function ChatPage() {
  return (
    <div className="flex h-screen bg-bg-deep text-white font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <ChatArea />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Remove unused VoiceAssistant import from `app/_components/ChatArea.tsx`**

Delete line 6 (`import VoiceAssistant from "../voice-assistance/page";`). The component was already commented out in JSX.

- [ ] **Step 4: Verify dev server starts without errors**

Run: `npm run dev`
Expected: Server starts at http://localhost:3000 with no errors. Visiting `/` should show the loading spinner then redirect to `/login` (since you're not logged in).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: move chat and voice-assistance pages into (protected) route group"
```

---

### Task 7: Update Login Page to Use Auth Context

**Files:**
- Modify: `app/(auth)/login/page.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `@/app/lib/auth-context` (specifically `login()`)
- Produces: Login page that uses auth context instead of direct API + localStorage calls

- [ ] **Step 1: Update the login handler in `app/(auth)/login/page.tsx`**

Replace the imports and handler section (lines 1-40) with:

```tsx
"use client"
import React, { useState } from 'react';
import { Bot, MessageSquare, Zap, Mic, Database } from 'lucide-react';
import { useAuth } from '@/app/lib/auth-context';

const LoginPage = () => {

    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submitLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };
```

The rest of the JSX (line 42 onward) stays exactly the same. Only the imports and handler change.

- [ ] **Step 2: Verify login flow works end-to-end**

Run: `npm run dev`
Steps:
1. Visit http://localhost:3000 → should redirect to /login
2. Enter valid credentials → should redirect to /
3. Refresh the page → should stay on / (token exists)
4. Visit /login while logged in → should redirect to /

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/login/page.tsx"
git commit -m "feat: update login page to use auth context"
```

---

### Task 8: Add Logout Button to Sidebar

**Files:**
- Modify: `app/_components/Sidebar.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `@/app/lib/auth-context` (specifically `logout()`)
- Produces: Logout button in the sidebar nav

- [ ] **Step 1: Add logout import and button to `app/_components/Sidebar.tsx`**

Add import at the top (after the existing lucide-react import):

```tsx
import { useAuth } from "@/app/lib/auth-context";
import { Menu, Plus, MessageSquare, History, X, LogOut } from "lucide-react";
```

Inside the component function, add:

```tsx
const { logout } = useAuth();
```

Add a logout button at the bottom of the `<aside>`, just before the closing `</aside>` tag (after the `</nav>` close):

```tsx
                {/* Logout */}
                <div className={`w-full pt-4 border-t border-white/5 ${isOpen ? "" : "flex justify-center"}`}>
                    <button
                        onClick={logout}
                        className={`flex items-center p-3 rounded-xl hover:bg-red-500/10 w-full group transition-colors
                        ${isOpen ? "justify-start gap-3" : "justify-center md:justify-center"}`}
                    >
                        <LogOut size={20} className="text-gray-400 group-hover:text-red-400 shrink-0" />
                        <span className={`text-sm text-gray-300 font-medium group-hover:text-red-400 whitespace-nowrap ${isOpen ? "block" : "hidden md:hidden"}`}>
                            Logout
                        </span>
                    </button>
                </div>
```

- [ ] **Step 2: Verify logout works**

Run: `npm run dev`
Steps:
1. Log in
2. Click the logout button in the sidebar
3. Should redirect to /login
4. Try accessing / directly → should redirect to /login (tokens cleared)

- [ ] **Step 3: Commit**

```bash
git add app/_components/Sidebar.tsx
git commit -m "feat: add logout button to sidebar"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Full flow test**

Start the Express backend (`cd ../api-ai-assistance && npm run dev`) and the Next.js frontend (`npm run dev`).

Test these scenarios:
1. **Unauthenticated access to /**: Redirects to /login
2. **Unauthenticated access to /voice-assistance**: Redirects to /login
3. **Login with valid credentials**: Redirects to /
4. **Logged-in user visits /login**: Redirects to /
5. **Logged-in user visits /registration**: Redirects to /
6. **Page refresh while logged in**: Stays on current page (no re-login)
7. **Logout**: Redirects to /login, can't access / anymore
8. **Expired token + refresh**: Wait 15 min (or manually remove accessToken from localStorage and keep refreshToken) — should auto-refresh

- [ ] **Step 2: Check for TypeScript errors**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 3: Final commit (if any remaining changes)**

```bash
git status
# If there are any uncommitted changes:
git add -A
git commit -m "chore: fix any remaining issues from auth implementation"
```
