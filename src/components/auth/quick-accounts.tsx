"use client";

import { motion } from "framer-motion";
import { Users, X } from "lucide-react";

import { useAccounts } from "@/hooks/use-accounts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerItem } from "@/components/ui/animated-container";

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
  const { accounts, mounted, removeAccount } = useAccounts();

  if (!mounted || accounts.length === 0) return null;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      <motion.div variants={staggerItem} className="flex items-center gap-2 text-white/40 text-sm">
        <Users className="h-5 w-5" />
        <span>Comptes enregistrés</span>
      </motion.div>
      <div className="flex flex-wrap gap-2">
        {accounts.map((account) => (
          <motion.div
            key={account.id}
            variants={staggerItem}
            whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.2)" }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all pr-2"
          >
            <Button
              variant="ghost"
              className="h-auto p-2 bg-transparent hover:bg-transparent"
              onClick={() => {
                const url = new URL("/login", window.location.origin);
                url.searchParams.set("email", account.email);
                window.location.href = url.toString();
              }}
            >
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={account.image ?? undefined} />
                <AvatarFallback className="bg-primary/20 text-xs text-primary">
                  {getInitials(account.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm text-white font-medium truncate max-w-[120px]">
                  {account.name ?? account.email}
                </span>
                <span className="text-xs text-white/40 truncate max-w-[120px]">
                  {account.email}
                </span>
              </div>
            </Button>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                removeAccount(account.id);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white"
              aria-label="Supprimer le compte enregistré"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
