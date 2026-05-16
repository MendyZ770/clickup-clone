"use client";

import { useRouter } from "next/navigation";
import { Users, X } from "lucide-react";

import { useAccounts } from "@/hooks/use-accounts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function QuickAccounts() {
  const router = useRouter();
  const { accounts, mounted, removeAccount } = useAccounts();

  if (!mounted || accounts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-white/40 text-sm">
        <Users className="h-4 w-4" />
        <span>Comptes enregistrés</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="group relative flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all pr-2"
          >
            <Button
              variant="ghost"
              className="h-auto p-2 bg-transparent hover:bg-transparent"
              onClick={() => {
                const url = new URL("/login", window.location.origin);
                url.searchParams.set("email", account.email);
                router.push(url.toString());
              }}
            >
              <Avatar className="h-7 w-7 mr-2">
                <AvatarImage src={account.image ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-[10px] text-primary">
                  {getInitials(account.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-xs text-white font-medium truncate max-w-[120px]">
                  {account.name ?? account.email}
                </span>
                <span className="text-[10px] text-white/40 truncate max-w-[120px]">
                  {account.email}
                </span>
              </div>
            </Button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeAccount(account.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white"
              aria-label="Supprimer le compte enregistré"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
