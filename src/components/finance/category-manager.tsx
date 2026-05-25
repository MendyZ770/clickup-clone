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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFinanceCategories } from "@/hooks/use-finance";
import { Trash2, Tag, MoreHorizontal, Pencil } from "lucide-react";

export function CategoryManager({ workspaceId }: { workspaceId?: string }) {
  const { categories, mutate } = useFinanceCategories(workspaceId);
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !workspaceId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, workspaceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to create category");
      }
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
      const res = await fetch(`/api/finance/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to delete category");
      }
      mutate();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName) return;
    try {
      const res = await fetch(`/api/finance/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to update category");
      }
      mutate();
      setEditing(null);
      setEditName("");
    } catch (error) {
      console.error(error);
    }
  };

  const CategoryRow = ({ c }: { c: import("@prisma/client").FinanceCategory }) => (
    <div className="flex items-center justify-between p-2 rounded-lg border group">
      {editing === c.id ? (
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => { if (e.key === "Enter") handleEdit(c.id); }}
            autoFocus
          />
          <Button size="sm" className="h-8 text-sm" onClick={() => handleEdit(c.id)}>
            OK
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-sm px-2" onClick={() => { setEditing(null); setEditName(""); }}>
            ✕
          </Button>
        </div>
      ) : (
        <>
          <span className="text-sm">{c.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setEditing(c.id); setEditName(c.name); }}>
                <Pencil className="h-5 w-5 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(c.id)} className="text-red-500 focus:text-red-500">
                <Trash2 className="h-5 w-5 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );

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
            <Tag className="h-5 w-5 text-emerald-500" />
            Revenus ({incomeCategories.length})
          </h3>
          <div className="space-y-2">
            {incomeCategories.map((c) => (
              <CategoryRow key={c.id} c={c} />
            ))}
            {incomeCategories.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune catégorie de revenu</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Tag className="h-5 w-5 text-rose-500" />
            Dépenses ({expenseCategories.length})
          </h3>
          <div className="space-y-2">
            {expenseCategories.map((c) => (
              <CategoryRow key={c.id} c={c} />
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
