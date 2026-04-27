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
      <div className="mx-auto max-w-3xl p-6 space-y-6">
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
        <p className="text-muted-foreground">Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your workspace configuration and members.
        </p>
      </div>

      {/* General settings */}
      <WorkspaceSettingsForm
        workspace={workspace}
        onSaved={() => mutate()}
      />

      {/* Members */}
      <MemberList
        workspaceId={workspace.id}
        members={workspace.members}
        onMemberAdded={() => mutate()}
        onMemberRemoved={() => mutate()}
      />

      {/* Danger zone */}
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <div>
              <p className="text-sm font-medium">Delete this workspace</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete this workspace and all of its data. This
                cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Delete workspace
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete workspace"
        description={`Are you sure you want to delete "${workspace.name}"? This will permanently delete all spaces, lists, tasks, and data within this workspace. This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
