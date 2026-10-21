"use client";

import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";
import { OUTBOX_EVENT, pendingCount } from "@/lib/offline-queue";

export function OfflineBadge() {
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const value = await pendingCount();
      if (alive) setQueued(value);
    };
    void refresh();
    const onOutbox = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === "number") setQueued(detail);
      else void refresh();
    };
    window.addEventListener(OUTBOX_EVENT, onOutbox);
    window.addEventListener("offline", refresh);
    window.addEventListener("online", refresh);
    return () => {
      alive = false;
      window.removeEventListener(OUTBOX_EVENT, onOutbox);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("online", refresh);
    };
  }, []);

  if (queued === 0) return null;

  const label = `${queued} modification${queued > 1 ? "s" : ""} en attente de synchronisation`;
  return (
    <div
      role="status"
      aria-live="polite"
      title={label}
      className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full border border-border/40 bg-muted/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-xl md:bottom-6"
    >
      <CloudOff className="h-3.5 w-3.5" />
      <span className="tabular-nums">{queued}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
