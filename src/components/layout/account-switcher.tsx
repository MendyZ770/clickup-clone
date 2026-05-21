"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Plus, Check } from "lucide-react";

import { useAccounts } from "@/hooks/use-accounts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function AccountSwitcher() {
  const router = useRouter();
  const { data: session } = useSession();
  const { accounts, mounted } = useAccounts();

  const user = session?.user;
  const currentUserId = user?.id;

  const otherAccounts = mounted
    ? accounts.filter((a) => a.id !== currentUserId)
    : [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={user?.name ?? user?.email ?? "Utilisateur"}
        >
          <Avatar className="ml-0.5 sm:ml-1 h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-primary/30 transition-all">
            <AvatarImage src={user?.image ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-sm text-primary">
              {getInitials(user?.name ?? null)}
            </AvatarFallback>
          </Avatar>
          {otherAccounts.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white border border-background"
            >
              {otherAccounts.length}
            </motion.span>
          )}
        </motion.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
        <DropdownMenuLabel className="flex items-center gap-3 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.image ?? undefined} />
            <AvatarFallback className="bg-primary/20 text-sm text-primary">
              {getInitials(user?.name ?? null)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">
              {user?.name ?? "Utilisateur"}
            </span>
            <span className="truncate text-sm text-muted-foreground">
              {user?.email}
            </span>
          </div>
          <Check className="ml-auto h-5 w-5 text-primary shrink-0" />
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {otherAccounts.length > 0 && (
          <>
            <motion.div variants={staggerItem} className="px-3 py-1.5 text-sm font-medium text-muted-foreground">
              Autres comptes
            </motion.div>
            {otherAccounts.map((account) => (
              <motion.div key={account.id} variants={staggerItem}>
              <DropdownMenuItem
                key={account.id}
                className="flex items-center gap-3 p-2 cursor-pointer"
                onSelect={() => {
                  // Sign out then redirect to login with prefill
                  signOut({ redirect: false }).then(() => {
                    const url = new URL("/login", window.location.origin);
                    url.searchParams.set("email", account.email);
                    window.location.href = url.toString();
                  });
                }}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={account.image ?? undefined} />
                  <AvatarFallback className="bg-muted text-sm">
                    {getInitials(account.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm">{account.name ?? account.email}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {account.email}
                  </span>
                </div>
              </DropdownMenuItem>
              </motion.div>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        <motion.div variants={staggerItem}>
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onSelect={() => {
            signOut({ redirect: false }).then(() => {
              router.push("/login");
            });
          }}
        >
          <Plus className="h-5 w-5" />
          <span>Ajouter un compte</span>
        </DropdownMenuItem>
        </motion.div>

        <motion.div variants={staggerItem}>
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          onSelect={() => {
            signOut({ callbackUrl: "/login" });
          }}
        >
          <LogOut className="h-5 w-5" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
        </motion.div>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
