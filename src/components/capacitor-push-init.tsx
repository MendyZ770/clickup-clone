"use client";

import { useCapacitorPush } from "@/hooks/use-capacitor-push";

export function CapacitorPushInit() {
  useCapacitorPush();
  return null;
}
