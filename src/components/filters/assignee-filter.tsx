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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Member {
  id: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface AssigneeFilterProps {
  workspaceId: string;
  selected: string[];
  onChange: (assigneeIds: string[]) => void;
}

export function AssigneeFilter({
  workspaceId,
  selected,
  onChange,
}: AssigneeFilterProps) {
  const [open, setOpen] = useState(false);
  const { data: members } = useSWR<Member[]>(
    open ? `/api/workspaces/${workspaceId}/members` : null,
    fetcher
  );

  const toggle = (userId: string) => {
    if (selected.includes(userId)) {
      onChange(selected.filter((s) => s !== userId));
    } else {
      onChange([...selected, userId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          Assignee
          {selected.length > 0 && (
            <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 text-primary">
              {selected.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1" align="start">
        {(members ?? []).map((m) => (
          <button
            key={m.user.id}
            onClick={() => toggle(m.user.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
          >
            <Avatar className="h-5 w-5">
              <AvatarImage src={m.user.image ?? undefined} />
              <AvatarFallback className="text-[9px]">
                {(m.user.name ?? m.user.email).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-left truncate">
              {m.user.name ?? m.user.email}
            </span>
            {selected.includes(m.user.id) && (
              <Check className="h-3.5 w-3.5 text-primary" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
