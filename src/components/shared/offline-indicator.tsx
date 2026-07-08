"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none mt-safe pt-2"
        >
          <div className="bg-destructive/90 text-destructive-foreground backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium border border-destructive/20 pointer-events-auto">
            <WifiOff className="h-4 w-4" />
            Mode hors-ligne
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
