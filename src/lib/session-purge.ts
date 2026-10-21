"use client";

import { clear } from "@/lib/offline-queue";

/**
 * Sur un appareil partagé, la déconnexion doit aussi effacer les données locales :
 * file d'attente hors-ligne et pages mises en cache par le service worker.
 */
export async function purgeLocalSession(): Promise<void> {
  await clear();
  if (typeof caches !== "undefined") {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}
