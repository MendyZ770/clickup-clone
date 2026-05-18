"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "sidebar-collapsed";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setCollapsedState(stored === "true");
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    try { localStorage.setItem(STORAGE_KEY, String(v)); } catch { /* ignore */ }
  };

  const toggle = () => setCollapsed(!collapsed);

  if (!mounted) {
    return (
      <SidebarContext.Provider value={{ collapsed: false, setCollapsed: () => {}, toggle: () => {} }}>
        {children}
      </SidebarContext.Provider>
    );
  }

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
