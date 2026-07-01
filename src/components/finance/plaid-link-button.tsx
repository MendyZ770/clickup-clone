"use client";

import { useState, useEffect, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface PlaidLinkButtonProps {
  workspaceId: string;
  onSuccess?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function PlaidLinkButton({ workspaceId, onSuccess, className, variant = "default" }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const createLinkToken = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/finance/plaid/create-link-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        });
        if (!res.ok) throw new Error("Failed to create link token");
        const data = await res.json();
        setLinkToken(data.link_token);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible d'initialiser Plaid. Vérifiez vos variables d'environnement.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    createLinkToken();
  }, [workspaceId, toast]);

  const onPlaidSuccess = useCallback(async (public_token: string, metadata: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/finance/plaid/exchange-public-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicToken: public_token,
          workspaceId,
          metadata,
        }),
      });

      if (!res.ok) throw new Error("Failed to exchange token");

      toast({
        title: "Banque connectée",
        description: "Vos comptes ont été synchronisés avec succès.",
      });
      
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la synchronisation de la banque.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, router, toast, onSuccess]);

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess: onPlaidSuccess,
  });

  return (
    <Button
      onClick={() => open()}
      disabled={!ready || isLoading || !linkToken}
      className={className}
      variant={variant}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Building2 className="mr-2 h-4 w-4" />
      )}
      Connecter ma banque
    </Button>
  );
}
