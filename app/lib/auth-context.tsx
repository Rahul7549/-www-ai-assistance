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
