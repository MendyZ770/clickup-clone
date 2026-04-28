"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceSettingsForm } from "@/components/workspace/workspace-settings-form";
import { MemberList } from "@/components/workspace/member-list";
import { InviteList } from "@/components/workspace/invite-list";
import { TeamList } from "@/components/workspace/team-list";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface WorkspaceData {
  id: string;
  name: string;
  description: string | null;
  color: string;
  members: Array<{
    id: string;
    role: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
}

export default function WorkspaceSettingsPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    data: workspace,
    isLoading,
    mutate,
  } = useSWR<WorkspaceData>(
    params.workspaceId
      ? `/api/workspaces/${params.workspaceId}`
      : null,
    fetcher
  );

  const handleDelete = async () => {
    if (!workspace) return;
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch {
      // Error handling
    } finally {
      setDeleteOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Espace de travail introuvable</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold">{"Paramètres de l'espace"}</h1>
        <p className="text-sm text-muted-foreground">
          Gérez la configuration et les membres de votre espace de travail.
        </p>
      </div>

      {/* General settings */}
      <WorkspaceSettingsForm
        workspace={workspace}
        onSaved={() => mutate()}
      />

      {/* Invites */}
      <InviteList workspaceId={workspace.id} />

      {/* Members */}
      <MemberList
        workspaceId={workspace.id}
        members={workspace.members}
        onMemberAdded={() => mutate()}
        onMemberRemoved={() => mutate()}
      />

      {/* Teams */}
      <TeamList workspaceId={workspace.id} />

      {/* Danger zone */}
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Zone de danger
          </CardTitle>
          <CardDescription>
            Actions irréversibles et destructives.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <div>
              <p className="text-sm font-medium">{"Supprimer cet espace de travail"}</p>
              <p className="text-xs text-muted-foreground">
                {"Supprimer définitivement cet espace et toutes ses données. Cette action est irréversible."}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              {"Supprimer l'espace"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer l'espace de travail"
        description={`Êtes-vous sûr de vouloir supprimer "${workspace.name}" ? Cela supprimera définitivement tous les espaces, listes, tâches et données de cet espace de travail. Cette action est irréversible.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
