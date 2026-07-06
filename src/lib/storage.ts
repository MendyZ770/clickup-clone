"use client";

/**
 * Stockage persistant cross-platform :
 * - Capacitor natif (Android) → Preferences (SharedPreferences, survit aux kills de process)
 * - Web → localStorage
 */

function isCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  // @ts-expect-error Capacitor global
  return !!(window.Capacitor?.isNativePlatform?.());
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (isCapacitor()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key, value });
  }
  localStorage.setItem(key, value);
}

export async function storageGet(key: string): Promise<string | null> {
  if (isCapacitor()) {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key });
    if (value) {
      // Sync it to localStorage so sync scripts can find it
      localStorage.setItem(key, value);
    }
    return value;
  } else {
    return localStorage.getItem(key);
  }
}

export async function storageRemove(key: string): Promise<void> {
  if (isCapacitor()) {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key });
  }
  localStorage.removeItem(key);
}
