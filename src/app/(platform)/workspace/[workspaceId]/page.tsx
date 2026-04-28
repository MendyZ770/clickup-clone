"use client";

import { use } from "react";
import useSWR from "swr";
import {
  Folder,
  List,
  Users,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import type { WorkspaceWithSpaces } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface PageProps {
  params: Promise<{ workspaceId: string }>;
}

export default function WorkspacePage({ params }: PageProps) {
  const { workspaceId } = use(params);
  const { data: workspace, isLoading } = useSWR<WorkspaceWithSpaces>(
    `/api/workspaces/${workspaceId}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="Espace de travail introuvable"
        description="Cet espace de travail n'existe pas ou vous n'y avez pas accès."
      />
    );
  }

  const totalLists = workspace.spaces.reduce(
    (acc, space) =>
      acc +
      space.lists.length +
      space.folders.reduce((fAcc, f) => fAcc + f.lists.length, 0),
    0
  );

  const totalFolders = workspace.spaces.reduce(
    (acc, space) => acc + space.folders.length,
    0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        {workspace.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {workspace.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{workspace.spaces.length}</p>
              <p className="text-xs text-muted-foreground">Espaces</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Folder className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalFolders}</p>
              <p className="text-xs text-muted-foreground">Dossiers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <List className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalLists}</p>
              <p className="text-xs text-muted-foreground">Listes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-500/10 p-2">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(workspace as unknown as { members: unknown[] }).members?.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Membres</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spaces */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Espaces</h2>
        {workspace.spaces.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="Aucun espace"
            description="Créez un espace pour organiser votre travail."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspace.spaces.map((space) => (
              <Link
                key={space.id}
                href={`/workspace/${workspaceId}/space/${space.id}`}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span
                        className="h-4 w-4 rounded"
                        style={{ backgroundColor: space.color ?? "#6B7280" }}
                      />
                      {space.name}
                      <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1">
                        <Folder className="h-3.5 w-3.5" />
                        {space.folders.length} dossiers
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <List className="h-3.5 w-3.5" />
                        {space.lists.length +
                          space.folders.reduce(
                            (acc, f) => acc + f.lists.length,
                            0
                          )}{" "}
                        listes
                      </span>
                    </div>
                    {space.description && (
                      <p className="mt-2 line-clamp-2">{space.description}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
