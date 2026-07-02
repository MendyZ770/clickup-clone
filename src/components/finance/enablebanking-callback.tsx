"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export function EnableBankingCallback({ handleMutate }: { handleMutate: () => void }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && state && !isSyncing) {
      setIsSyncing(true);
      toast({
        title: "Synchronisation...",
        description: "Liaison du compte bancaire en cours...",
      });

      fetch("/api/finance/enablebanking/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, state }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast({
              title: "Succès",
              description: "Compte bancaire lié avec succès.",
            });
            handleMutate();
            router.replace("/finance");
          } else {
            throw new Error(data.error || "Erreur inconnue");
          }
        })
        .catch((err) => {
          console.error(err);
          toast({
            title: "Erreur",
            description: err.message || "Impossible de lier le compte bancaire.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }
  }, [searchParams, router, toast, handleMutate, isSyncing]);

  return null;
}
