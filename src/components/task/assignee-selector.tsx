"use client";

import { useState } from "react";
import useSWR from "swr";
import { User as UserIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface Member {
  id: string;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface AssigneeSelectorProps {
  assignee: { id: string; name: string | null; email: string; image: string | null } | null;
  workspaceId: string;
  onChange?: (userId: string | null) => void;
  size?: "sm" | "md";
  className?: string;
}

export function AssigneeSelector({
  assignee,
  workspaceId,
  onChange,
  size = "sm",
  className,
}: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: members } = useSWR<Member[]>(
    open ? `/api/workspaces/${workspaceId}/members` : null,
    fetcher
  );

  const avatarSize = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  const trigger = (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md p-0.5 transition-colors",
        onChange && "hover:bg-muted cursor-pointer",
        className
      )}
    >
      {assignee ? (
        <Avatar className={avatarSize}>
          <AvatarImage src={assignee.image ?? undefined} />
          <AvatarFallback className="text-[10px]">
            {(assignee.name ?? assignee.email).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div
          className={cn(
            avatarSize,
            "rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
          )}
        >
          <UserIcon className="h-3 w-3 text-muted-foreground/50" />
        </div>
      )}
    </button>
  );

  if (!onChange) return trigger;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <div className="space-y-0.5">
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
          >
            <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <UserIcon className="h-3 w-3 text-muted-foreground/50" />
            </div>
            <span className={cn("text-muted-foreground", textSize)}>
              Unassigned
            </span>
          </button>
          {(members ?? []).map((m) => (
            <button
              key={m.user.id}
              onClick={() => {
                onChange(m.user.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted",
                assignee?.id === m.user.id && "bg-muted"
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={m.user.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(m.user.name ?? m.user.email).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className={cn("truncate", textSize)}>
                {m.user.name ?? m.user.email}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
