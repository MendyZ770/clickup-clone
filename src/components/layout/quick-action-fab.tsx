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
      className="grid gap-3 py-2 px-1"
    >
      <motion.button
        variants={staggerItem}
        onClick={() => {
          setOpen(false);
          if (currentWorkspace) {
            setTimeout(() => openCreateTask(currentWorkspace.id), 250);
          }
        }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-4 rounded-[1.5rem] border border-primary/10 p-4 text-left transition-colors hover:bg-primary/5 bg-background shadow-sm"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-primary/10">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-[15px]">Nouvelle tâche</p>
          <p className="text-[13px] text-muted-foreground mt-0.5">Créer une tâche dans l'espace</p>
        </div>
      </motion.button>

      <motion.button
        variants={staggerItem}
        onClick={() => {
          setOpen(false);
          router.push("/reminders");
        }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-4 rounded-[1.5rem] border border-amber-500/10 p-4 text-left transition-colors hover:bg-amber-500/5 bg-background shadow-sm"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-amber-500/10">
          <Bell className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <p className="font-semibold text-[15px]">Nouveau rappel</p>
          <p className="text-[13px] text-muted-foreground mt-0.5">Programmer une alerte</p>
        </div>
      </motion.button>

      <motion.button
        variants={staggerItem}
        onClick={() => {
          setOpen(false);
          router.push("/notes");
        }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-4 rounded-[1.5rem] border border-emerald-500/10 p-4 text-left transition-colors hover:bg-emerald-500/5 bg-background shadow-sm"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-emerald-500/10">
          <NotebookPen className="h-6 w-6 text-emerald-500" />
        </div>
        <div>
          <p className="font-semibold text-[15px]">Nouvelle note</p>
          <p className="text-[13px] text-muted-foreground mt-0.5">Capturer une idée rapidement</p>
        </div>
      </motion.button>

      <div className="grid grid-cols-2 gap-3 mt-1">
        <motion.button
          variants={staggerItem}
          onClick={() => {
            setOpen(false);
            setTransactionType("income");
            setTimeout(() => setShowTransactionForm(true), 250);
          }}
          whileTap={{ scale: 0.96 }}
          className="flex flex-col items-center gap-2 rounded-[1.5rem] border border-emerald-500/20 p-4 text-center transition-colors hover:bg-emerald-500/10 bg-emerald-500/5 shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-semibold text-[13px] text-emerald-700 dark:text-emerald-300">Revenu</p>
        </motion.button>

        <motion.button
          variants={staggerItem}
          onClick={() => {
            setOpen(false);
            setTransactionType("expense");
            setTimeout(() => setShowTransactionForm(true), 250);
          }}
          whileTap={{ scale: 0.96 }}
          className="flex flex-col items-center gap-2 rounded-[1.5rem] border border-rose-500/20 p-4 text-center transition-colors hover:bg-rose-500/10 bg-rose-500/5 shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20">
            <Wallet className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="font-semibold text-[13px] text-rose-700 dark:text-rose-300">Dépense</p>
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.85 }}
        className={cn(
          "fixed right-5 md:right-6 md:bottom-6 z-40",
          "flex items-center justify-center",
          "h-[3.25rem] w-[3.25rem] md:h-16 md:w-16 rounded-full",
          "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
          "shadow-[0_8px_32px_rgba(var(--primary),0.4)]",
          "ring-2 ring-primary/20 backdrop-blur-xl"
        )}
        style={
          isDesktop
            ? {}
            : { bottom: "calc(7.2rem + env(safe-area-inset-bottom))" }
        }
        aria-label="Nouvelle action rapide"
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Plus className="h-7 w-7 md:h-8 md:w-8 stroke-[2.5]" />
        </motion.div>
      </motion.button>

      {isDesktop ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-xl">Action rapide</DialogTitle>
            </DialogHeader>
            <ActionButtons />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="px-5 pb-10 bg-background/80 backdrop-blur-3xl border-t border-white/10">
            <DrawerHeader className="px-0 pt-6 pb-4">
              <DrawerTitle className="text-2xl font-bold tracking-tight">Que voulez-vous créer ?</DrawerTitle>
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
