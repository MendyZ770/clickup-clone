"use client";

import { useSession } from "next-auth/react";
import { useMobileAuth } from "@/lib/mobile-auth";

interface UnifiedSession {
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  status: "authenticated" | "unauthenticated" | "loading";
}

export function useUnifiedSession(): UnifiedSession {
  const { data: session, status } = useSession();
  const mobile = useMobileAuth();

  if (session?.user) {
    return {
      user: session.user,
      status: "authenticated" as const,
    };
  }

  if (mobile.status === "authenticated" && mobile.user) {
    return {
      user: {
        id: mobile.user.id,
        email: mobile.user.email,
        name: mobile.user.name,
        image: mobile.user.image,
      },
      status: "authenticated" as const,
    };
  }

  if (status === "loading" || mobile.status === "loading") {
    return { status: "loading" as const };
  }

  return { status: "unauthenticated" as const };
}
