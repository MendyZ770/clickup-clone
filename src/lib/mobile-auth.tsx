"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface MobileUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface MobileAuthContext {
  user: MobileUser | null;
  token: string | null;
  status: "loading" | "authenticated" | "unauthenticated";
  logout: () => void;
}

const MobileAuthCtx = createContext<MobileAuthContext>({
  user: null,
  token: null,
  status: "loading",
  logout: () => {},
});

export function MobileAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    const storedToken = localStorage.getItem("mobile_auth_token");
    if (!storedToken) {
      setStatus("unauthenticated");
      return;
    }

    fetch("/api/mobile-me", {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setUser(data);
          setToken(storedToken);
          setStatus("authenticated");
        } else {
          localStorage.removeItem("mobile_auth_token");
          setStatus("unauthenticated");
        }
      })
      .catch(() => {
        setStatus("unauthenticated");
      });
  }, []);

  const logout = () => {
    localStorage.removeItem("mobile_auth_token");
    setUser(null);
    setToken(null);
    setStatus("unauthenticated");
    window.location.href = "/login";
  };

  return (
    <MobileAuthCtx.Provider value={{ user, token, status, logout }}>
      {children}
    </MobileAuthCtx.Provider>
  );
}

export function useMobileAuth() {
  return useContext(MobileAuthCtx);
}
