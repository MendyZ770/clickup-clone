"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, FileText, Bell, NotebookPen, Wallet, TrendingUp } from "lucide-react";
import { QuickAddTransaction } from "@/components/budget/quick-add-transaction";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";
import { QuickCreateTask } from "@/components/task/quick-create-task";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { staggerContainer, staggerItem } from "@/components/ui/animated-container";

export function QuickActionFab() {
  const [open, setOpen] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={cn(
          "fixed right-4 bottom-20 md:right-6 md:bottom-6 z-40",
          "flex h-14 w-14 md:h-16 md:w-16 items-center justify-center",
          "rounded-full bg-primary text-primary-foreground shadow-lg",
          "ring-2 ring-primary/20"
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

      {/* Quick Action Menu Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle action</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <AnimatePresence mode="wait">
            {!showTaskForm ? (
              <motion.div
                key="menu"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -8 }}
                className="grid gap-2"
              >
                <motion.button
                  variants={staggerItem}
                  onClick={() => setShowTaskForm(true)}
                  whileHover={{ x: 3, borderColor: "hsl(var(--primary) / 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Nouvelle tâche</p>
                    <p className="text-sm text-muted-foreground">
                      Créer une tâche rapidement
                    </p>
                  </div>
                </motion.button>
                <motion.button
                  variants={staggerItem}
                  onClick={() => {
                    setOpen(false);
                    router.push("/reminders");
                  }}
                  whileHover={{ x: 3, borderColor: "hsl(var(--primary) / 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                    <Bell className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">Nouveau rappel</p>
                    <p className="text-sm text-muted-foreground">
                      Ajouter un rappel
                    </p>
                  </div>
                </motion.button>
                <motion.button
                  variants={staggerItem}
                  onClick={() => {
                    setOpen(false);
                    router.push("/notes");
                  }}
                  whileHover={{ x: 3, borderColor: "hsl(var(--primary) / 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                    <NotebookPen className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium">Nouvelle note</p>
                    <p className="text-sm text-muted-foreground">
                      Prendre une note
                    </p>
                  </div>
                </motion.button>
                <motion.button
                  variants={staggerItem}
                  onClick={() => {
                    setOpen(false);
                    setTransactionType("income");
                    setShowTransactionForm(true);
                  }}
                  whileHover={{ x: 3, borderColor: "hsl(var(--primary) / 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium">Nouvelle entrée</p>
                    <p className="text-sm text-muted-foreground">
                      Ajouter un revenu à un budget
                    </p>
                  </div>
                </motion.button>
                <motion.button
                  variants={staggerItem}
                  onClick={() => {
                    setOpen(false);
                    setTransactionType("expense");
                    setShowTransactionForm(true);
                  }}
                  whileHover={{ x: 3, borderColor: "hsl(var(--primary) / 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10">
                    <Wallet className="h-6 w-6 text-rose-500" />
                  </div>
                  <div>
                    <p className="font-medium">Ajouter une dépense</p>
                    <p className="text-sm text-muted-foreground">
                      Ajouter une dépense à un budget
                    </p>
                  </div>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTaskForm(false)}
                    className="rounded-md p-1 hover:bg-accent"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium">Nouvelle tâche</span>
                </div>
                <QuickCreateTask
                  workspaceId={currentWorkspace?.id ?? null}
                  onCreated={() => {
                    setOpen(false);
                    setShowTaskForm(false);
                  }}
                />
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Add Transaction Dialog */}
      <QuickAddTransaction
        open={showTransactionForm}
        onOpenChange={setShowTransactionForm}
        defaultType={transactionType}
      />
    </>
  );
}
