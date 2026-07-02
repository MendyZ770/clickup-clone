"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Bell, NotebookPen, Wallet, TrendingUp } from "lucide-react";
import { QuickAddTransaction } from "@/components/budget/quick-add-transaction";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";
import { useModal } from "@/providers/modal-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useRouter } from "next/navigation";
import { staggerContainer, staggerItem } from "@/components/ui/animated-container";
import { useMediaQuery } from "@/hooks/use-media-query";

export function QuickActionFab() {
  const [open, setOpen] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const { currentWorkspace } = useWorkspace();
  const { openCreateTask } = useModal();
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const ActionButtons = () => (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-2 py-2"
    >
      <motion.button
        variants={staggerItem}
        onClick={() => {
          setOpen(false);
          if (currentWorkspace) {
            setTimeout(() => openCreateTask(currentWorkspace.id), 250);
          }
        }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors hover:bg-accent bg-card shadow-sm"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-semibold">Nouvelle tâche</p>
          <p className="text-sm text-muted-foreground">Créer une tâche</p>
        </div>
      </motion.button>

      <motion.button
        variants={staggerItem}
        onClick={() => {
          setOpen(false);
          router.push("/reminders");
        }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors hover:bg-accent bg-card shadow-sm"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
          <Bell className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <p className="font-semibold">Nouveau rappel</p>
          <p className="text-sm text-muted-foreground">Ajouter un rappel</p>
        </div>
      </motion.button>

      <motion.button
        variants={staggerItem}
        onClick={() => {
          setOpen(false);
          router.push("/notes");
        }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors hover:bg-accent bg-card shadow-sm"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
          <NotebookPen className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <p className="font-semibold">Nouvelle note</p>
          <p className="text-sm text-muted-foreground">Prendre une note</p>
        </div>
      </motion.button>

      <motion.button
        variants={staggerItem}
        onClick={() => {
          setOpen(false);
          setTransactionType("income");
          setTimeout(() => setShowTransactionForm(true), 250);
        }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors hover:bg-accent bg-card shadow-sm"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
          <TrendingUp className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <p className="font-semibold">Nouveau revenu</p>
          <p className="text-sm text-muted-foreground">Ajouter un revenu</p>
        </div>
      </motion.button>

      <motion.button
        variants={staggerItem}
        onClick={() => {
          setOpen(false);
          setTransactionType("expense");
          setTimeout(() => setShowTransactionForm(true), 250);
        }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors hover:bg-accent bg-card shadow-sm"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10">
          <Wallet className="h-6 w-6 text-rose-500" />
        </div>
        <div>
          <p className="font-semibold">Nouvelle dépense</p>
          <p className="text-sm text-muted-foreground">Ajouter une dépense</p>
        </div>
      </motion.button>
    </motion.div>
  );

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        style={{
          bottom: "calc(4.5rem + env(safe-area-inset-bottom) + 1rem)",
        }}
        className={cn(
          "fixed right-4 md:right-6 md:bottom-6 md:[bottom:unset] z-40",
          "flex h-14 w-14 md:h-16 md:w-16 items-center justify-center",
          "rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30",
          "ring-4 ring-primary/20 backdrop-blur-md"
        )}
        aria-label="Nouvelle action rapide"
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Plus className="h-8 w-8 md:h-9 md:w-9" />
        </motion.div>
      </motion.button>

      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvelle action</DialogTitle>
            </DialogHeader>
            <ActionButtons />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="px-4 pb-8">
            <DrawerHeader className="px-0">
              <DrawerTitle>Nouvelle action</DrawerTitle>
            </DrawerHeader>
            <ActionButtons />
          </DrawerContent>
        </Drawer>
      )}

      <QuickAddTransaction
        open={showTransactionForm}
        onOpenChange={setShowTransactionForm}
        defaultType={transactionType}
      />
    </>
  );
}
