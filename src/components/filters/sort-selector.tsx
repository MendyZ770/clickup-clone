"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "createdAt", label: "Date de création" },
  { value: "dueDate", label: "Échéance" },
  { value: "priority", label: "Priorité" },
  { value: "title", label: "Titre" },
  { value: "status", label: "Statut" },
] as const;

interface SortSelectorProps {
  sortBy: string | null;
  sortOrder: "asc" | "desc" | null;
  onChange: (sortBy: string | null, sortOrder: "asc" | "desc") => void;
}

export function SortSelector({
  sortBy,
  sortOrder,
  onChange,
}: SortSelectorProps) {
  const currentLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
          <ArrowUpDown className="h-3 w-3" />
          {currentLabel ? `Tri : ${currentLabel}` : "Trier"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {SORT_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() =>
              onChange(opt.value, sortOrder ?? "asc")
            }
            className={cn(sortBy === opt.value && "bg-muted")}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
        {sortBy && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onChange(sortBy, "asc")}
              className={cn("gap-1", sortOrder === "asc" && "bg-muted")}
            >
              <ArrowUp className="h-3 w-3" />
              Croissant
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onChange(sortBy, "desc")}
              className={cn("gap-1", sortOrder === "desc" && "bg-muted")}
            >
              <ArrowDown className="h-3 w-3" />
              Décroissant
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onChange(null, "asc")}
              className="text-muted-foreground"
            >
              Effacer le tri
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
