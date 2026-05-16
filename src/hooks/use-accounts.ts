"use client";

import { useCallback, useEffect, useState } from "react";

const ACCOUNTS_KEY = "done-accounts";

export interface SavedAccount {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function loadAccounts(): SavedAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: SavedAccount[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAccounts(loadAccounts());
    setMounted(true);
  }, []);

  const addAccount = useCallback(
    (account: { id: string; email: string; name: string | null; image: string | null }) => {
      setAccounts((prev) => {
        const filtered = prev.filter((a) => a.id !== account.id && a.email !== account.email);
        const next = [account, ...filtered].slice(0, 5);
        saveAccounts(next);
        return next;
      });
    },
    []
  );

  const removeAccount = useCallback((id: string) => {
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveAccounts(next);
      return next;
    });
  }, []);

  const getInitialsFor = useCallback(
    (account: SavedAccount) => getInitials(account.name),
    []
  );

  return {
    accounts,
    mounted,
    addAccount,
    removeAccount,
    getInitialsFor,
  };
}
