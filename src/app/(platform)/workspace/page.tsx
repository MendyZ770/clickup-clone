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
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-sm text-muted-foreground">
            Select a workspace or create a new one
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(workspaces ?? []).map((ws) => (
            <Link key={ws.id} href={`/workspace/${ws.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center gap-4 p-4">
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
                        {ws._count.spaces} spaces
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {ws.members.length} members
                      </span>
                    </div>
                  </div>
                  <div className="flex -space-x-2 shrink-0">
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
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}

          {workspaces?.length === 0 && (
            <div className="text-center py-12">
              <div className="mb-4 rounded-full bg-muted p-4 inline-block">
                <LayoutGrid className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">
                No workspaces yet
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your first workspace to get started.
              </p>
              <Button onClick={() => setShowCreate(true)}>
                Create Workspace
              </Button>
            </div>
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
