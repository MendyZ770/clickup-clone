"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelect } from "./category-select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

const INCOME_SUBTYPES = [
  { value: "salary", label: "Salaire" },
  { value: "freelance", label: "Freelance" },
  { value: "investment", label: "Investissements" },
  { value: "refund", label: "Remboursement" },
  { value: "gift", label: "Cadeau / Don" },
  { value: "other_income", label: "Autre revenu" },
];

const EXPENSE_SUBTYPES = [
  { value: "rent", label: "Loyer / Charges" },
  { value: "food", label: "Nourriture / Courses" },
  { value: "transport", label: "Transport" },
  { value: "health", label: "Santé" },
  { value: "leisure", label: "Loisirs / Sorties" },
  { value: "shopping", label: "Shopping" },
  { value: "bills", label: "Factures" },
  { value: "education", label: "Éducation / Formation" },
  { value: "travel", label: "Voyage" },
  { value: "subscription", label: "Abonnements" },
  { value: "other_expense", label: "Autre dépense" },
];

const transactionSchema = z.object({
  amount: z.number().positive("Le montant doit être positif"),
  type: z.enum(["income", "expense"]),
  subType: z.string().optional(),
  description: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetId: string;
  workspaceId: string;
  onSubmit: (data: {
    amount: number;
    type: "income" | "expense";
    subType?: string;
    description?: string;
    date: string;
    categoryId?: string;
    tags?: string[];
  }) => void;
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  workspaceId,
  onSubmit,
}: AddTransactionDialogProps) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [subType, setSubType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = transactionSchema.safeParse({
      amount: parseFloat(amount),
      type,
      subType: subType || undefined,
      description: description || undefined,
      date: new Date(date).toISOString(),
      categoryId: categoryId && categoryId !== "__none__" ? categoryId : undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    onSubmit(parsed.data);
    setIsSubmitting(false);
    onOpenChange(false);
    setAmount("");
    setSubType("");
    setDescription("");
    setCategoryId("");
    setTags([]);
    setTagInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => { setType(v as "income" | "expense"); setSubType(""); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Revenu</SelectItem>
                <SelectItem value="expense">Dépense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Catégorie détaillée</Label>
            <Select value={subType} onValueChange={(v) => setSubType(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {(type === "income" ? INCOME_SUBTYPES : EXPENSE_SUBTYPES).map((st) => (
                  <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Catégorie personnalisée</Label>
            <CategorySelect
              workspaceId={workspaceId}
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Ajouter un tag..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    e.preventDefault();
                    if (!tags.includes(tagInput.trim())) {
                      setTags([...tags, tagInput.trim()]);
                    }
                    setTagInput("");
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                    setTags([...tags, tagInput.trim()]);
                    setTagInput("");
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
