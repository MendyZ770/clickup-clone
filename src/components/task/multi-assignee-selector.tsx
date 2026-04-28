"use client";

import { useState } from "react";
import useSWR from "swr";
import { UserPlus, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface MemberUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Assignee {
  id: string;
  userId: string;
  user: MemberUser;
}

interface MultiAssigneeSelectorProps {
  taskId: string;
  workspaceId: string;
}

export function MultiAssigneeSelector({ taskId, workspaceId }: MultiAssigneeSelectorProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const { data: assignees, mutate } = useSWR<Assignee[]>(
    `/api/tasks/${taskId}/assignees`,
    fetcher
  );

  const { data: members } = useSWR<{ user: MemberUser }[]>(
    workspaceId ? `/api/workspaces/${workspaceId}/members` : null,
    fetcher
  );

  const assigneeIds = new Set(assignees?.map((a) => a.userId) ?? []);

  const filteredMembers = (Array.isArray(members) ? members : []).filter((m) => {
    if (assigneeIds.has(m.user.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.user.name?.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q));
  });

  const handleAdd = async (userId: string) => {
    await fetch(`/api/tasks/${taskId}/assignees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    mutate();
  };

  const handleRemove = async (userId: string) => {
    await fetch(`/api/tasks/${taskId}/assignees?userId=${userId}`, { method: "DELETE" });
    mutate();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {(assignees ?? []).map((a) => (
          <div key={a.id} className="flex items-center gap-1 rounded-full border pl-0.5 pr-1.5 py-0.5">
            <Avatar className="h-5 w-5">
              <AvatarImage src={a.user.image ?? undefined} />
              <AvatarFallback className="text-[8px]">
                {(a.user.name ?? a.user.email)[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs truncate max-w-[80px]">{a.user.name ?? a.user.email}</span>
            <button onClick={() => handleRemove(a.userId)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <UserPlus className="h-3 w-3" />
              Ajouter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 space-y-2" align="start">
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 text-xs"
            />
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {filteredMembers.map((m) => (
                <button
                  key={m.user.id}
                  onClick={() => { handleAdd(m.user.id); setSearch(""); }}
                  className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={m.user.image ?? undefined} />
                    <AvatarFallback className="text-[8px]">
                      {(m.user.name ?? m.user.email)[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{m.user.name ?? m.user.email}</span>
                </button>
              ))}
              {filteredMembers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Aucun membre</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
