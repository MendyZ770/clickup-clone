"use client";

/**
 * Outbox hors-ligne : les mutations échouées faute de réseau sont mises en file
 * d'attente (IndexedDB) rejouées à la reconnexion, avec une clé d'idempotence
 * pour qu'un même enregistrement ne soit pas appliqué deux fois.
 */

import { storageGet } from "@/lib/storage";

export type QueuedRequest = {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  createdAt: number;
  attempts: number;
};

const DB_NAME = "done-offline";

// Signale à l’interface le nombre d’écritures en attente de rejeu.
export const OUTBOX_EVENT = "done:outbox-changed";
function emitOutboxChange(count: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OUTBOX_EVENT, { detail: count }));
}
const STORE = "outbox";
const MAX_ENTRIES = 200;
const MAX_ATTEMPTS = 5;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest | Promise<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = run(transaction.objectStore(STORE));
    if (request && "onsuccess" in request) {
      (request as IDBRequest).onsuccess = () =>
        resolve((request as IDBRequest).result as T);
      (request as IDBRequest).onerror = () => reject(request.error);
    }
    transaction.oncomplete = () => {
      if (!request || !("onsuccess" in request)) resolve(undefined as T);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function enqueue(entry: QueuedRequest): Promise<void> {
  await tx("readwrite", (store) => store.put(entry));
  const all = await list();
  if (all.length > MAX_ENTRIES) {
    for (const stale of all.slice(0, all.length - MAX_ENTRIES)) {
      await tx("readwrite", (store) => store.delete(stale.id));
    }
  }
  emitOutboxChange(Math.min(all.length, MAX_ENTRIES));
}

export async function list(): Promise<QueuedRequest[]> {
  const entries = await tx<QueuedRequest[]>("readonly", (store) => store.getAll());
  return (entries ?? []).sort((a, b) => a.createdAt - b.createdAt);
}

export async function remove(id: string): Promise<void> {
  await tx("readwrite", (store) => store.delete(id));
  const rest = await list();
  emitOutboxChange(rest.length);
}

export async function clear(): Promise<void> {
  await tx("readwrite", (store) => store.clear());
  emitOutboxChange(0);
}

function idempotencyKey(id: string): string {
  return `offline-${id}`;
}

let replaying: Promise<void> | null = null;

/** Rejoue la file, une entrée à la fois, en ordre chronologique. */
export function replayOutbox(): Promise<void> {
  if (replaying) return replaying;
  replaying = (async () => {
    for (const entry of await list()) {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      let res: Response;
      try {
        const headers = { ...entry.headers };
        // Ne jamais rejouer avec le token stocké au moment de la mise en file :
        // il peut être expiré ou appartenir à un compte précédent.
        delete headers.Authorization;
        delete headers.authorization;
        const token = await storageGet("mobile_auth_token");
        if (token) headers.Authorization = `Bearer ${token}`;
        headers["X-Idempotency-Key"] = idempotencyKey(entry.id);

        res = await fetch(entry.url, {
          method: entry.method,
          headers,
          body: entry.body,
        });
      } catch {
        return;
      }
      // 2xx/408/429/5xx → rejouable ; les autres codes sont des rejets définitifs.
      if (res.ok) {
        await remove(entry.id);
        continue;
      }
      if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
        await remove(entry.id);
        notify(entry, "rejected");
        continue;
      }
      const attempts = entry.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await remove(entry.id);
        notify(entry, "dropped");
      } else {
        await tx("readwrite", (store) => store.put({ ...entry, attempts }));
      }
    }
  })().finally(() => {
    replaying = null;
  });
  return replaying;
}

export type OutboxEvent = "rejected" | "dropped";

function notify(entry: QueuedRequest, event: OutboxEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("offline-outbox", { detail: { entry, event } })
  );
}

export async function pendingCount(): Promise<number> {
  return (await list()).length;
}

let installed = false;

/** À appeler une fois au démarrage : rejoue la file dès que le réseau revient. */
export function installOutboxReplay(): () => void {
  if (typeof window === "undefined" || installed) return () => {};
  installed = true;

  const go = () => {
    void replayOutbox().then(() => void pendingCount());
  };
  window.addEventListener("online", go);
  go();

  return () => {
    installed = false;
    window.removeEventListener("online", go);
  };
}

export function toQueuedRequest(
  url: string,
  init: RequestInit,
  headers: Record<string, string>
): QueuedRequest {
  const storedHeaders = { ...headers };
  // Le token est régénéré au rejeu : pas de secret durable dans IndexedDB.
  delete storedHeaders.Authorization;
  delete storedHeaders.authorization;

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    url,
    method: (init.method ?? "POST").toUpperCase(),
    headers: storedHeaders,
    body: typeof init.body === "string" ? init.body : null,
    createdAt: Date.now(),
    attempts: 0,
  };
}
