/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceCategories } from "@/hooks/use-finance";
import { Trash2, Tag } from "lucide-react";

export function CategoryManager({ workspaceId }: { workspaceId?: string }) {
  const { categories, mutate } = useFinanceCategories(workspaceId);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incomeCategories = categories.filter((c: any) => c.type === "income");
  const expenseCategories = categories.filter((c: any) => c.type === "expense");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !workspaceId) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, workspaceId }),
      });
      mutate();
      setName("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try {
      await fetch(`/api/finance/categories/${id}`, { method: "DELETE" });
      mutate();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex gap-2 items-end">
        <div className="flex-1 space-y-2">
          <Label>Nouvelle catégorie</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Bébé, Kasher, Freelance..."
          />
        </div>
        <div className="w-32 space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Revenu</SelectItem>
              <SelectItem value="expense">Dépense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isSubmitting || !name}>
          Ajouter
        </Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-emerald-500" />
            Revenus ({incomeCategories.length})
          </h3>
          <div className="space-y-2">
            {incomeCategories.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border">
                <span>{c.name}</span>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {incomeCategories.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune catégorie de revenu</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-rose-500" />
            Dépenses ({expenseCategories.length})
          </h3>
          <div className="space-y-2">
            {expenseCategories.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border">
                <span>{c.name}</span>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {expenseCategories.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune catégorie de dépense</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
