"use client";

import { useState } from "react";
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
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-4 bottom-20 md:right-6 md:bottom-6 z-40",
          "flex h-12 w-12 md:h-14 md:w-14 items-center justify-center",
          "rounded-full bg-primary text-primary-foreground shadow-lg",
          "transition-transform duration-200 hover:scale-105 active:scale-95",
          "ring-2 ring-primary/20"
        )}
        aria-label="Nouvelle action rapide"
      >
        <Plus className="h-6 w-6 md:h-7 md:w-7" />
      </button>

      {/* Quick Action Menu Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle action</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            {!showTaskForm ? (
              <>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Nouvelle tâche</p>
                    <p className="text-xs text-muted-foreground">
                      Créer une tâche rapidement
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push("/reminders");
                  }}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10">
                    <Bell className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">Nouveau rappel</p>
                    <p className="text-xs text-muted-foreground">
                      Ajouter un rappel
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push("/notes");
                  }}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
                    <NotebookPen className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium">Nouvelle note</p>
                    <p className="text-xs text-muted-foreground">
                      Prendre une note
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setTransactionType("income");
                    setShowTransactionForm(true);
                  }}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium">Nouvelle entrée</p>
                    <p className="text-xs text-muted-foreground">
                      Ajouter un revenu à un budget
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setTransactionType("expense");
                    setShowTransactionForm(true);
                  }}
                  className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10">
                    <Wallet className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="font-medium">Ajouter une dépense</p>
                    <p className="text-xs text-muted-foreground">
                      Ajouter une dépense à un budget
                    </p>
                  </div>
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTaskForm(false)}
                    className="rounded-md p-1 hover:bg-accent"
                  >
                    <X className="h-4 w-4" />
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
              </div>
            )}
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
