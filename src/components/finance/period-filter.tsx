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
    <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 border border-border/30 overflow-x-auto hide-scrollbar w-full sm:w-auto">
      <div className="flex items-center shrink-0">
        <CalendarRange className="h-5 w-5 text-muted-foreground mx-2" />
      </div>
      {PERIODS.map((p) => (
        <Button
          key={p.value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(p.value)}
          className={cn(
            "h-9 text-sm px-3 rounded-md transition-all shrink-0 whitespace-nowrap",
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
