"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Plus,
  Users,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface WorkspaceItem {
  id: string;
  name: string;
  description: string | null;
  color: string;
  members: {
    id: string;
    user: { id: string; name: string | null; email: string; image: string | null };
  }[];
  _count: { spaces: number };
}

export default function WorkspaceListPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: workspaces, isLoading } = useSWR<WorkspaceItem[]>(
    "/api/workspaces",
    fetcher
  );

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-4 md:space-y-6">
      <PageHeader
        icon={LayoutGrid}
        title="Espaces de travail"
        description="Sélectionnez un espace ou créez-en un nouveau"
        actions={
          <Button onClick={() => setShowCreate(true)} className="gap-1" size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvel espace</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(workspaces ?? []).map((ws) => (
            <Link key={ws.id} href={`/workspace/${ws.id}`} className="block group">
              <Card className="border-border/50 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="flex items-center gap-3 md:gap-4 p-3 md:p-4">
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: ws.color }}
                  >
                    {ws.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg">{ws.name}</p>
                    {ws.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {ws.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <LayoutGrid className="h-3 w-3" />
                        {ws._count.spaces} espace{ws._count.spaces > 1 ? "s" : ""}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {ws.members.length} membre{ws.members.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex -space-x-2 shrink-0">
                    {ws.members.slice(0, 4).map((m) => (
                      <Avatar key={m.id} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={m.user.image ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {(m.user.name ?? m.user.email)
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {ws.members.length > 4 && (
                      <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] text-muted-foreground">
                        +{ws.members.length - 4}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </CardContent>
              </Card>
            </Link>
          ))}

          {workspaces?.length === 0 && (
            <EmptyState
              icon={LayoutGrid}
              title="Aucun espace de travail"
              description="Créez votre premier espace pour commencer."
              actionLabel="Créer un espace"
              onAction={() => setShowCreate(true)}
            />
          )}
        </div>
      )}

      <CreateWorkspaceDialog
        open={showCreate}
        onOpenChange={setShowCreate}
      />
    </div>
  );
}
