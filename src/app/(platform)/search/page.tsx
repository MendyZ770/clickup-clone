"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  FileText,
  List,
  Compass,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/use-workspace";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface SearchTask {
  id: string;
  title: string;
  priority: string;
  status: { id: string; name: string; color: string };
  assignee: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  list: { id: string; name: string };
}

interface SearchList {
  id: string;
  name: string;
  space: { id: string; name: string };
  _count: { tasks: number };
}

interface SearchSpace {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

interface SearchResults {
  tasks: SearchTask[];
  lists: SearchList[];
  spaces: SearchSpace[];
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentWorkspace } = useWorkspace();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const performSearch = useCallback(
    async (q: string) => {
      if (!q.trim() || !currentWorkspace) {
        setResults(null);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&workspaceId=${currentWorkspace.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        // Silently fail
      } finally {
        setIsSearching(false);
      }
    },
    [currentWorkspace]
  );

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const totalResults =
    (results?.tasks.length ?? 0) +
    (results?.lists.length ?? 0) +
    (results?.spaces.length ?? 0);

  const hasResults = results && totalResults > 0;
  const showEmpty = results && totalResults === 0 && debouncedQuery.trim();

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Rechercher</h1>
        <p className="text-sm text-muted-foreground">
          Trouvez des tâches, listes et espaces dans votre espace de travail
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher tâches, listes, espaces..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          autoFocus
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results */}
      {hasResults && (
        <div className="space-y-6">
          {/* Tasks */}
          {results.tasks.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Tâches
                </h2>
                <Badge variant="secondary" className="text-[10px]">
                  {results.tasks.length}
                </Badge>
              </div>
              <div className="rounded-lg border border-border/50">
                {results.tasks.map((task, idx) => (
                  <button
                    key={task.id}
                    onClick={() => router.push(`/task/${task.id}`)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                      idx > 0 && "border-t border-border/50"
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: task.status.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        dans {task.list.name}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-[10px] capitalize"
                    >
                      {task.priority}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Lists */}
          {results.lists.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <List className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Listes
                </h2>
                <Badge variant="secondary" className="text-[10px]">
                  {results.lists.length}
                </Badge>
              </div>
              <div className="rounded-lg border border-border/50">
                {results.lists.map((list, idx) => (
                  <button
                    key={list.id}
                    onClick={() => {
                      if (currentWorkspace) {
                        router.push(
                          `/workspace/${currentWorkspace.id}/space/${list.space.id}/list/${list.id}`
                        );
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                      idx > 0 && "border-t border-border/50"
                    )}
                  >
                    <List className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {list.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        dans {list.space.name} &middot; {list._count.tasks} tâches
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Spaces */}
          {results.spaces.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Compass className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Espaces
                </h2>
                <Badge variant="secondary" className="text-[10px]">
                  {results.spaces.length}
                </Badge>
              </div>
              <div className="rounded-lg border border-border/50">
                {results.spaces.map((space, idx) => (
                  <button
                    key={space.id}
                    onClick={() => {
                      if (currentWorkspace) {
                        router.push(
                          `/workspace/${currentWorkspace.id}/space/${space.id}`
                        );
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                      idx > 0 && "border-t border-border/50"
                    )}
                  >
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: space.color }}
                    >
                      {space.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {space.name}
                      </p>
                      {space.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {space.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Empty state */}
      {showEmpty && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">Aucun résultat</h3>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Aucune tâche, liste ou espace ne correspond à &quot;{debouncedQuery}&quot;.
            Essayez d&apos;autres mots-clés.
          </p>
        </div>
      )}

      {/* Initial state */}
      {!results && !isSearching && !query.trim() && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">
            Recherchez dans votre espace
          </h3>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Trouvez des tâches par titre ou description, recherchez des listes et espaces.
            Vous pouvez aussi appuyer sur{" "}
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              Cmd+K
            </kbd>{" "}
            depuis n&apos;importe où.
          </p>
        </div>
      )}
    </div>
  );
}
