"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMobileAuth } from "@/lib/mobile-auth";

export function MobileHomeRedirect() {
  const { status } = useMobileAuth();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // @ts-expect-error Capacitor global
    if (typeof window !== "undefined" && !!window.Capacitor?.isNativePlatform?.()) {
      setIsMobile(true);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
      router.refresh();
    }
  }, [status, router]);

  // If we are on mobile and still checking auth, hide the landing page
  if (isMobile && status === "loading") {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25 animate-pulse">
            <span className="text-white font-bold text-xl">D</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
