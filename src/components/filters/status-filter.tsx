"use client";

import { useState } from "react";
import useSWR from "swr";
import { Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface StatusFilterProps {
  listId: string;
  selected: string[];
  onChange: (statusIds: string[]) => void;
}

interface StatusOption {
  id: string;
  name: string;
  color: string;
}

export function StatusFilter({ listId, selected, onChange }: StatusFilterProps) {
  const [open, setOpen] = useState(false);
  const { data: statuses } = useSWR<StatusOption[]>(
    open ? `/api/lists/${listId}/statuses` : null,
    fetcher
  );

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          Statut
          {selected.length > 0 && (
            <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 text-primary">
              {selected.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        {(statuses ?? []).map((s) => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
          >
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="flex-1 text-left truncate">{s.name}</span>
            {selected.includes(s.id) && (
              <Check className="h-3.5 w-3.5 text-primary" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
