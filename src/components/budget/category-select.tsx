"use client";

import { useBudgetCategories } from "@/hooks/use-budget-categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag } from "lucide-react";

interface CategorySelectProps {
  workspaceId: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CategorySelect({
  workspaceId,
  value,
  onChange,
  placeholder = "Catégorie",
}: CategorySelectProps) {
  const { categories } = useBudgetCategories(workspaceId);

  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Aucune catégorie</SelectItem>
        {categories.map((cat) => (
          <SelectItem key={cat.id} value={cat.id}>
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" style={{ color: cat.color }} />
              <span>{cat.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
