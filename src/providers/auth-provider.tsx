"use client";

import { SessionProvider } from "next-auth/react";
import { MobileAuthProvider } from "@/lib/mobile-auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <MobileAuthProvider>{children}</MobileAuthProvider>
    </SessionProvider>
  );
}
