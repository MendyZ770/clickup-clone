"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, FileText, Loader2, MoreVertical, Trash } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Document {
  id: string;
  title: string;
  updatedAt: string;
}

export default function DocsListPage() {
  const router = useRouter();
  const params = useParams<{ workspaceId: string }>();
  const [docs, setDocs] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchDocs = async () => {
    try {
      const res = await fetch(`/api/docs?workspaceId=${params.workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [params.workspaceId]);

  const handleCreateDoc = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Document sans titre",
          workspaceId: params.workspaceId,
        }),
      });

      if (res.ok) {
        const newDoc = await res.json();
        router.push(`/workspace/${params.workspaceId}/docs/${newDoc.id}`);
      }
    } catch (error) {
      console.error("Failed to create doc", error);
      setIsCreating(false);
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;

    try {
      await fetch(`/api/docs/${docId}`, { method: "DELETE" });
      setDocs(docs.filter((d) => d.id !== docId));
    } catch (error) {
      console.error("Failed to delete doc", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos notes, cahiers des charges et spécifications.
          </p>
        </div>
        <Button onClick={handleCreateDoc} disabled={isCreating} className="w-full sm:w-auto">
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Nouveau Document
        </Button>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Aucun document</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Commencez par créer votre premier document collaboratif.
          </p>
          <Button onClick={handleCreateDoc} disabled={isCreating} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Créer un document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {docs.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:border-primary/50 transition-colors group relative"
              onClick={() => router.push(`/workspace/${params.workspaceId}/docs/${doc.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary/70 mb-2" />
                  <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            // Let the handler stop propagation
                            handleDelete(doc.id, e as any);
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardTitle className="line-clamp-2 text-lg leading-tight">
                  {doc.title}
                </CardTitle>
              </CardHeader>
              <CardFooter className="pt-0">
                <p className="text-xs text-muted-foreground">
                  Modifié le {format(new Date(doc.updatedAt), "d MMM yyyy", { locale: fr })}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
