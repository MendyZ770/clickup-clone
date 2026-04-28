"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="mb-2 text-xl font-bold">{"Une erreur s'est produite"}</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          {"Cette page a rencontré un problème. Vos données sont intactes."}
        </p>
        {error.digest && (
          <p className="mb-4 font-mono text-[10px] text-muted-foreground/60">
            Code : {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-2">
          <Button onClick={reset} size="sm" className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Tableau de bord
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
