"use client";

import { useState } from "react";
import { Wallet, Plus } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from "@/hooks/use-budgets";
import { PageHeader } from "@/components/shared/page-header";
import { BudgetCard } from "@/components/budget/budget-card";
import { BudgetFormDialog } from "@/components/budget/budget-form-dialog";
import { BudgetPageSkeleton } from "@/components/budget/budget-skeleton";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { BudgetWithTransactions } from "@/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function BudgetPage() {
  const { currentWorkspace } = useWorkspace();
  const { budgets, isLoading, mutate } = useBudgets(currentWorkspace?.id);
  const { createBudget } = useCreateBudget();
  const { updateBudget } = useUpdateBudget();
  const { deleteBudget } = useDeleteBudget();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithTransactions | null>(null);

  const handleCreate = async (data: {
    name: string;
    description?: string;
    amount: number;
    currency: string;
    color: string;
    workspaceId: string;
  }) => {
    await createBudget(data);
    mutate();
  };

  const handleEdit = (budget: BudgetWithTransactions) => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleUpdate = async (data: {
    name: string;
    description?: string;
    amount: number;
    currency: string;
    color: string;
    workspaceId: string;
  }) => {
    if (editingBudget) {
      await updateBudget(editingBudget.id, data);
      mutate();
      setEditingBudget(null);
    }
  };

  const handleDelete = async (budgetId: string) => {
    await deleteBudget(budgetId);
    mutate();
  };

  if (!currentWorkspace) {
    return (
      <div className="mx-auto max-w-6xl p-3 md:p-6">
        <p className="text-muted-foreground">Sélectionnez un espace de travail pour voir vos budgets.</p>
      </div>
    );
  }

  if (isLoading) return <BudgetPageSkeleton />;

  return (
    <div className="mx-auto max-w-6xl p-3 md:p-6 space-y-6">
      <PageHeader
        icon={Wallet}
        title="Budgets"
        description={`Gestion des budgets de ${currentWorkspace.name}`}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau budget
          </Button>
        }
      />

      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Wallet className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Aucun budget</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Créez votre premier budget pour suivre vos dépenses et revenus.
          </p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Créer un budget
          </Button>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {budgets.map((budget) => (
            <motion.div key={budget.id} variants={item}>
              <BudgetCard
                budget={budget}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <BudgetFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingBudget(null);
        }}
        workspaceId={currentWorkspace.id}
        budget={editingBudget}
        onSubmit={editingBudget ? handleUpdate : handleCreate}
      />
    </div>
  );
}
