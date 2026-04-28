"use client";

import { useEffect } from "react";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Platform error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="mb-2 text-xl font-bold">{"Une erreur s'est produite"}</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          {"Cette page a rencontré un problème. Vos données sont intactes."}
        </p>
        {error.message && (
          <p className="mb-2 text-xs text-red-500 font-mono break-all">
            {error.message}
          </p>
        )}
        {error.digest && (
          <p className="mb-4 font-mono text-[10px] text-muted-foreground/60">
            Code : {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Réessayer
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Tableau de bord
          </a>
        </div>
      </div>
    </div>
  );
}
