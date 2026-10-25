"use client";

import { storageGet } from "@/lib/storage";
import { enqueue, toQueuedRequest } from "@/lib/offline-queue";

const MUTATIONS = ["POST", "PATCH", "PUT", "DELETE"];

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "Une erreur est survenue. Veuillez réessayer.";
}

function serverMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  for (const key of ["error", "message", "details"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

const FRENCH_FALLBACK: Record<number, string> = {
  400: "Requête invalide.",
  401: "Session expirée. reconnectez-vous.",
  403: "Action non autorisée.",
  404: "Élément introuvable.",
  409: "Conflit: l'élément a déjà été modifié.",
  429: "Trop de tentatives. Réessayez plus tard.",
};

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const token = await storageGet("mobile_auth_token");
  const headers = new Headers(init?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const method = (init?.method ?? "GET").toUpperCase();
  const hasJsonBody = headers.get("Content-Type")?.includes("application/json");
  // Les DELETE n'ont pas de corps : on les met aussi en file pour que les
  // suppressions fonctionnent hors-ligne.
  const isQueuedMutation =
    (hasJsonBody && MUTATIONS.includes(method)) || method === "DELETE";

  // Hors-ligne : les écritures JSON sont mises en file et rejouées à la reconnexion.
  if (isQueuedMutation && typeof navigator !== "undefined" && !navigator.onLine) {
    const record: Record<string, string> = {};
    headers.forEach((value, key) => (record[key] = value));
    await enqueue(
      toQueuedRequest(input, { ...init, method }, record)
    );
    return new Response(
      JSON.stringify({ queued: true, offline: true }),
      { status: 202, headers: { "Content-Type": "application/json" } }
    );
  }

  return fetch(input, { ...init, headers });
}

/** JSON request that throws ApiError (with a French, server-provided message) on any non-2xx response. */
export async function apiJson<T = unknown>(
  input: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await apiFetch(input, init);
  } catch {
    throw new ApiError("Connexion impossible. Vérifiez votre réseau.", 0);
  }

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const fallback = FRENCH_FALLBACK[res.status] ?? `Erreur ${res.status}.`;
    throw new ApiError(
      (typeof payload === "string" ? null : serverMessage(payload)) ?? fallback,
      res.status,
      payload
    );
  }

  return (payload ?? null) as T;
}
