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

interface EnableBankingLinkButtonProps {
  workspaceId: string;
  onSuccess?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function EnableBankingLinkButton({ workspaceId, onSuccess, className, variant = "default" }: EnableBankingLinkButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState("");
  const [banks, setBanks] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && banks.length === 0) {
      // Fetch available institutions
      fetch("/api/finance/enablebanking/institutions")
        .then(res => res.json())
        .then(data => {
          if (data.aspsps) {
            setBanks(data.aspsps);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, banks]);

  const handleConnect = async () => {
    if (!selectedBank) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/finance/enablebanking/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, bankName: selectedBank }),
      });
      if (!res.ok) throw new Error("Failed to create link");
      const data = await res.json();
      
      // Redirect user to bank
      window.location.href = data.url;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'initialiser Enable Banking. Vérifiez vos clés d'API.",
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
            Choisissez votre banque pour synchroniser vos transactions automatiquement (usage personnel).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Select value={selectedBank} onValueChange={setSelectedBank} disabled={banks.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={banks.length === 0 ? "Chargement des banques..." : "Sélectionnez une banque..."} />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank: any) => (
                <SelectItem key={bank.name} value={bank.name}>
                  {bank.title || bank.name}
                </SelectItem>
              ))}
              {banks.length === 0 && (
                <SelectItem value="loading" disabled>Chargement...</SelectItem>
              )}
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
