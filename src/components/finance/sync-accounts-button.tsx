"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function SyncAccountsButton({ 
  accounts, 
  onSync 
}: { 
  accounts: any[]; 
  onSync: () => void;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    // Only sync accounts that are connected to Enable Banking
    const linkedAccounts = accounts.filter(a => a.ebAccountId);
    
    if (linkedAccounts.length === 0) {
      toast({
        title: "Aucun compte lié",
        description: "Connectez d'abord une banque pour synchroniser.",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    let totalImported = 0;
    
    try {
      // Sync each account one by one
      const syncPromises = linkedAccounts.map(async (acc) => {
        const res = await fetch("/api/finance/enablebanking/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId: acc.id })
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log(`Sync data for account ${acc.name}:`, data);
          if (data.skippedCount > 0) {
             console.warn(`Skipped ${data.skippedCount} transactions for ${acc.name} due to missing fields.`);
          }
          if (data.importedCount) {
            return data.importedCount;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Erreur serveur (${res.status})`);
        }
        return 0;
      });

      const results = await Promise.all(syncPromises);
      totalImported = results.reduce((acc, count) => acc + count, 0);

      toast({
        title: "Synchronisation terminée",
        description: totalImported > 0 
          ? `${totalImported} nouvelle(s) transaction(s) importée(s).` 
          : "Vos comptes sont à jour, aucune nouvelle transaction.",
      });
      
      onSync();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur de synchronisation",
        description: error instanceof Error ? error.message : "Un problème est survenu lors de la synchronisation de vos comptes.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button 
      variant="secondary" 
      onClick={handleSync} 
      disabled={isSyncing}
      className="shadow-sm"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Synchronisation..." : "Synchroniser"}
    </Button>
  );
}
