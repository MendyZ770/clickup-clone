"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { apiJson, apiErrorMessage } from "@/lib/api-client";

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

      apiJson<{ success?: boolean; error?: string }>("/api/finance/enablebanking/callback", {
        method: "POST",
        body: JSON.stringify({ code, state }),
      })
        .then((data) => {
          if (data?.success) {
            toast({
              title: "Succès",
              description: "Compte bancaire lié avec succès.",
            });
            handleMutate();
            router.replace("/finance");
          } else {
            toast({
              title: "Erreur",
              description: data?.error || "Impossible de lier le compte bancaire.",
              variant: "destructive",
            });
          }
        })
        .catch((error) => {
          toast({
            title: "Erreur",
            description: apiErrorMessage(error),
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
