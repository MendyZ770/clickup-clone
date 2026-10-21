"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { storageGet, storageRemove } from "@/lib/storage";
import { purgeLocalSession } from "@/lib/session-purge";

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
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const MobileAuthCtx = createContext<MobileAuthContext>({
  user: null,
  token: null,
  status: "loading",
  logout: async () => {},
  refresh: async () => {},
});

export function MobileAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  const refresh = useCallback(async () => {
    const storedToken = await storageGet(MOBILE_TOKEN_KEY);
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setStatus("unauthenticated");
      return;
    }

    try {
      const r = await fetch("/api/mobile-me", {
        headers: { Authorization: `Bearer ${storedToken}` },
        credentials: "include",
      });
      if (r.ok) {
        const data = await r.json();
        setUser(data);
        setToken(storedToken);
        setStatus("authenticated");
      } else {
        await storageRemove(MOBILE_TOKEN_KEY);
        setUser(null);
        setToken(null);
        setStatus("unauthenticated");
      }
    } catch {
      // Réseau indisponible — on conserve le token pour un prochain essai.
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    const storedToken = await storageGet(MOBILE_TOKEN_KEY).catch(() => null);
    try {
      await fetch("/api/mobile-logout", {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : undefined,
      });
    } catch {
      // Le nettoyage local doit aboutir même si le réseau est coupé.
    }
    await storageRemove(MOBILE_TOKEN_KEY).catch(() => {});
    await purgeLocalSession().catch(() => {});
    setUser(null);
    setToken(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <MobileAuthCtx.Provider value={{ user, token, status, logout, refresh }}>
      {children}
    </MobileAuthCtx.Provider>
  );
}

export function useMobileAuth() {
  return useContext(MobileAuthCtx);
}
