"use client";

import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PeriodFilter = "this-month" | "last-month" | "this-year" | "all";

const PERIODS: { value: PeriodFilter; label: string }[] = [
  { value: "this-month", label: "Ce mois" },
  { value: "last-month", label: "Mois dernier" },
  { value: "this-year", label: "Cette année" },
  { value: "all", label: "Tout" },
];

export function PeriodFilter({ value, onChange }: { value: PeriodFilter; onChange: (v: PeriodFilter) => void }) {
  return (
    <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 border border-border/30">
      <CalendarRange className="h-3.5 w-3.5 text-muted-foreground ml-2" />
      {PERIODS.map((p) => (
        <Button
          key={p.value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(p.value)}
          className={cn(
            "h-7 text-xs px-3 rounded-md transition-all",
            value === p.value
              ? "bg-background text-foreground shadow-sm font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-transparent"
          )}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
