"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Users,
  Plus,
  Trash2,
  Loader2,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";

interface WorkspaceMemberDto {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface TeamMemberDto {
  id: string;
  workspaceMember: WorkspaceMemberDto;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string;
  members: TeamMemberDto[];
  _count: { members: number };
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

const PRESET_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#10B981",
  "#06B6D4",
];

interface TeamListProps {
  workspaceId: string;
}

export function TeamList({ workspaceId }: TeamListProps) {
  const { toast } = useToast();

  const { data: teams, mutate } = useSWR<Team[]>(
    `/api/workspaces/${workspaceId}/teams`,
    fetcher
  );

  const { data: workspaceMembers } = useSWR<
    Array<{ id: string; user: { id: string; name: string | null; email: string; image: string | null } }>
  >(`/api/workspaces/${workspaceId}/members`, fetcher);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || null,
          color: newColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setNewName("");
      setNewDesc("");
      setNewColor(PRESET_COLORS[0]);
      setCreateOpen(false);
      mutate();
      toast({ title: "Équipe créée" });
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de créer",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (team: Team) => {
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/teams/${team.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erreur");
      mutate();
      toast({ title: "Équipe supprimée" });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer",
        variant: "destructive",
      });
    } finally {
      setDeletingTeam(null);
    }
  };

  const handleAddMember = async (teamId: string, workspaceMemberId: string) => {
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/teams/${teamId}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceMemberId }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      mutate();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'ajouter",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (teamId: string, workspaceMemberId: string) => {
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/teams/${teamId}/members?workspaceMemberId=${workspaceMemberId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erreur");
      mutate();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de retirer",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return email[0].toUpperCase();
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4" />
            Équipes
          </CardTitle>
          <CardDescription>
            {"Regroupez vos membres en équipes pour organiser le travail."}
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvelle équipe</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!teams ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucune équipe</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {"Créez une équipe pour regrouper vos membres."}
            </p>
          </div>
        ) : (
          teams.map((team) => {
            const existingIds = new Set(
              team.members.map((m) => m.workspaceMember.id)
            );
            const available = (workspaceMembers ?? []).filter(
              (m) => !existingIds.has(m.id)
            );
            return (
              <div
                key={team.id}
                className="rounded-lg border border-border/50 p-3 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{team.name}</p>
                    {team.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {team.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                    onClick={() => setDeletingTeam(team)}
                    aria-label="Supprimer l'équipe"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Members */}
                <div className="flex items-center gap-1 flex-wrap">
                  {team.members.map((tm) => (
                    <div
                      key={tm.id}
                      className="group inline-flex items-center gap-1.5 rounded-full bg-muted pl-0.5 pr-2 py-0.5"
                      title={tm.workspaceMember.user.name ?? tm.workspaceMember.user.email}
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={tm.workspaceMember.user.image ?? undefined} />
                        <AvatarFallback className="text-[9px]">
                          {getInitials(tm.workspaceMember.user.name, tm.workspaceMember.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] truncate max-w-[100px]">
                        {tm.workspaceMember.user.name ?? tm.workspaceMember.user.email.split("@")[0]}
                      </span>
                      <button
                        onClick={() => handleRemoveMember(team.id, tm.workspaceMember.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
                        aria-label="Retirer"
                      >
                        <UserMinus className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {available.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 gap-1 text-[11px]"
                        >
                          <UserPlus className="h-3 w-3" />
                          Ajouter
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-1" align="start">
                        <div className="max-h-56 overflow-y-auto">
                          {available.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => handleAddMember(team.id, m.id)}
                              className={cn(
                                "flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                              )}
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={m.user.image ?? undefined} />
                                <AvatarFallback className="text-[9px]">
                                  {getInitials(m.user.name, m.user.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-xs font-medium truncate">
                                  {m.user.name ?? m.user.email}
                                </p>
                                {m.user.name && (
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {m.user.email}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle équipe</DialogTitle>
            <DialogDescription>
              {"Créez une équipe pour regrouper plusieurs membres."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="team-name">Nom</Label>
              <Input
                id="team-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Équipe frontend"
                autoFocus
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-desc">Description (optionnel)</Label>
              <Input
                id="team-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Front-end et UI"
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                      newColor === c ? "border-foreground" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={creating || !newName.trim()}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deletingTeam}
        onOpenChange={() => setDeletingTeam(null)}
        title="Supprimer l'équipe"
        description={
          deletingTeam
            ? `Êtes-vous sûr de vouloir supprimer "${deletingTeam.name}" ? Les membres ne seront pas retirés de l'espace.`
            : ""
        }
        onConfirm={() => deletingTeam && handleDelete(deletingTeam)}
        variant="destructive"
      />
    </Card>
  );
}
