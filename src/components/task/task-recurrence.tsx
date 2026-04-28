"use client";

import { useState } from "react";
import { Repeat, X, Loader2 } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

const PATTERNS = [
  { value: "daily", label: "Quotidien" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "biweekly", label: "Bi-hebdomadaire" },
  { value: "monthly", label: "Mensuel" },
  { value: "yearly", label: "Annuel" },
];

interface TaskRecurrenceProps {
  taskId: string;
}

export function TaskRecurrence({ taskId }: TaskRecurrenceProps) {
  const { data, mutate } = useSWR(`/api/tasks/${taskId}/recurrence`, fetcher);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [pattern, setPattern] = useState("weekly");
  const [interval, setInterval] = useState(1);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/tasks/${taskId}/recurrence`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern, interval }),
      });
      mutate();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    await fetch(`/api/tasks/${taskId}/recurrence`, { method: "DELETE" });
    mutate();
  };

  if (data?.pattern) {
    const label = PATTERNS.find((p) => p.value === data.pattern)?.label ?? data.pattern;
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs gap-1">
          <Repeat className="h-3 w-3" />
          {label}{data.interval > 1 ? ` (x${data.interval})` : ""}
        </Badge>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleRemove}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1.5">
          <Repeat className="h-3 w-3" />
          Récurrence
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start">
        <p className="text-sm font-medium">Configurer la récurrence</p>
        <Select value={pattern} onValueChange={setPattern}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PATTERNS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Tous les</span>
          <input
            type="number"
            min={1}
            max={30}
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
            className="h-8 w-16 rounded-md border px-2 text-xs"
          />
          <span className="text-xs text-muted-foreground">fois</span>
        </div>
        <Button size="sm" className="w-full text-xs" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          Enregistrer
        </Button>
      </PopoverContent>
    </Popover>
  );
}
