"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import {
  Folder,
  List,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ViewSwitcher } from "@/components/layout/view-switcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BoardView } from "@/components/views/board-view";
import { ListView } from "@/components/views/list-view";
import { GanttView } from "@/components/views/gantt-view";
import { TableView } from "@/components/views/table-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { LayoutGrid, CalendarRange, Table2, PieChart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreateFolderDialog } from "@/components/folder/create-folder-dialog";
import { CreateListDialog } from "@/components/list/create-list-dialog";
import type { SpaceWithContents } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

export default function SpacePage() {
  const params = useParams<{ workspaceId: string; spaceId: string }>();
  const { workspaceId, spaceId } = params;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = searchParams.get("view") || "overview";

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createListOpen, setCreateListOpen] = useState(false);

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", val);
    router.push(`${pathname}?${params.toString()}`);
  };

  const { data: space, isLoading, mutate } = useSWR<SpaceWithContents>(
    `/api/spaces/${spaceId}`,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Espace introuvable"
        description="Cet espace n'existe pas ou vous n'y avez pas accès."
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="h-6 w-6 rounded"
            style={{ backgroundColor: space.color ?? "#6B7280" }}
          />
          <div>
            <h1 className="text-2xl font-bold">{space.name}</h1>
            {space.description && (
              <p className="text-sm text-muted-foreground">{space.description}</p>
            )}
          </div>
        </div>
        <ViewSwitcher />
      </div>

      {/* Tabs for Overview vs Board */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center mb-6 border-b border-border/50 pb-2">
          <TabsList className="bg-transparent space-x-2 p-0 h-auto">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium"
            >
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              Liste (Space)
            </TabsTrigger>
            <TabsTrigger
              value="board"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium flex items-center gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Tableau (Space)
            </TabsTrigger>
            <TabsTrigger
              value="gantt"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium flex items-center gap-2"
            >
              <CalendarRange className="h-4 w-4" />
              Gantt
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium flex items-center gap-2"
            >
              <Table2 className="h-4 w-4" />
              Table
            </TabsTrigger>
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium flex items-center gap-2"
            >
              <PieChart className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Folders */}
          {space.folders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Dossiers
              </h2>
              <div className="space-y-3">
                {space.folders.map((folder) => (
                  <Card key={folder.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        {folder.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {folder.lists.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Aucune liste dans ce dossier
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {folder.lists.map((list) => (
                            <Link
                              key={list.id}
                              href={`/workspace/${workspaceId}/space/${spaceId}/list/${list.id}/list-view`}
                              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                              <List className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="flex-1">{list.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {list.statuses.length} statuts
                              </span>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Standalone Lists */}
          {space.lists.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <List className="h-5 w-5" />
                Listes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {space.lists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/workspace/${workspaceId}/space/${spaceId}/list/${list.id}/list-view`}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="flex items-center gap-3 p-4">
                        <List className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{list.name}</p>
                          <div className="flex gap-1 mt-1">
                            {list.statuses.slice(0, 5).map((s) => (
                              <span
                                key={s.id}
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: s.color }}
                                title={s.name}
                              />
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {space.folders.length === 0 && space.lists.length === 0 && (
            <EmptyState
              icon={FolderOpen}
              title="Cet espace est vide"
              description="Créez un dossier ou une liste pour commencer à organiser vos tâches. Les dossiers permettent de regrouper plusieurs listes."
            >
              <div className="flex items-center gap-3 justify-center">
                <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
                  Créer un dossier
                </Button>
                <Button onClick={() => setCreateListOpen(true)}>
                  Créer une liste
                </Button>
              </div>
            </EmptyState>
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <div className="-mx-4 md:-mx-6">
             <ListView spaceId={spaceId} workspaceId={workspaceId} />
          </div>
        </TabsContent>

        <TabsContent value="board" className="mt-0">
          <div className="-mx-4 md:-mx-6">
             <BoardView workspaceId={workspaceId} spaceId={spaceId} />
          </div>
        </TabsContent>

        <TabsContent value="gantt" className="mt-0">
          <div className="-mx-4 md:-mx-6">
             <GanttView workspaceId={workspaceId} spaceId={spaceId} />
          </div>
        </TabsContent>

        <TabsContent value="table" className="mt-0">
          <div className="-mx-4 md:-mx-6">
             <TableView workspaceId={workspaceId} spaceId={spaceId} />
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-0">
          <div className="-mx-4 md:-mx-6">
             <DashboardView workspaceId={workspaceId} spaceId={spaceId} />
          </div>
        </TabsContent>
      </Tabs>

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        spaceId={spaceId}
        onCreated={() => mutate()}
      />

      <CreateListDialog
        open={createListOpen}
        onOpenChange={setCreateListOpen}
        spaceId={spaceId}
        onCreated={() => mutate()}
      />
    </div>
  );
}
