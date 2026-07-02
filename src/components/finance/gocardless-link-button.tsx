"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, Landmark } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface GoCardlessLinkButtonProps {
  workspaceId: string;
  onSuccess?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

// Pour cet exemple, nous avons hardcodé quelques banques FR communes.
// En production, il faudrait appeler l'API /institutions de GoCardless.
const POPULAR_BANKS = [
  { id: "SANDBOXFINANCE_SFIN0000", name: "Sandbox Finance (Test)" },
  { id: "CA_CACA0000", name: "Crédit Agricole" },
  { id: "SG_SOCI0000", name: "Société Générale" },
  { id: "BNP_BNPA0000", name: "BNP Paribas" },
  { id: "CE_CECE0000", name: "Caisse d'Épargne" },
  { id: "BP_BPOP0000", name: "Banque Populaire" },
  { id: "LBP_POBA0000", name: "La Banque Postale" },
  { id: "BOU_BOBS0000", name: "BoursoBank" },
  { id: "FOR_FOTU0000", name: "Fortuneo" },
  { id: "N26_N26B0000", name: "N26" },
  { id: "REVOLUT_REVOGB21", name: "Revolut" },
];

export function GoCardlessLinkButton({ workspaceId, onSuccess, className, variant = "default" }: GoCardlessLinkButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!selectedBank) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/finance/gocardless/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, institutionId: selectedBank }),
      });
      if (!res.ok) throw new Error("Failed to create link");
      const data = await res.json();
      
      // Redirect user to bank
      window.location.href = data.link;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'initialiser GoCardless. Vérifiez vos clés d'API.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={className} variant={variant}>
          <Landmark className="mr-2 h-4 w-4" />
          Connecter ma banque
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sélectionnez votre banque</DialogTitle>
          <DialogDescription>
            Choisissez votre banque pour synchroniser vos transactions automatiquement via GoCardless.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez une banque..." />
            </SelectTrigger>
            <SelectContent>
              {POPULAR_BANKS.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            className="w-full" 
            disabled={!selectedBank || isLoading} 
            onClick={handleConnect}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
            Continuer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
