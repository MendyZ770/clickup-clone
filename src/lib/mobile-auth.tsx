"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { storageGet, storageRemove, storageSet } from "@/lib/storage";

export const MOBILE_TOKEN_KEY = "mobile_auth_token";

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
    async function init() {
      const storedToken = await storageGet(MOBILE_TOKEN_KEY);
      if (!storedToken) {
        setStatus("unauthenticated");
        return;
      }

      try {
        const r = await fetch("/api/mobile-me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (r.ok) {
          const data = await r.json();
          setUser(data);
          setToken(storedToken);
          setStatus("authenticated");
        } else {
          await storageRemove(MOBILE_TOKEN_KEY);
          setStatus("unauthenticated");
        }
      } catch {
        // Réseau indisponible — on garde le token et on reste "loading"
        // pour réessayer au prochain montage
        setStatus("unauthenticated");
      }
    }

    init();
  }, []);

  const logout = async () => {
    await storageRemove(MOBILE_TOKEN_KEY);
    fetch("/api/mobile-logout", { method: "POST" }).catch(() => {});
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
