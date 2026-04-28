"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  List,
  Folder,
  Clock,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useWorkspace } from "@/hooks/use-workspace";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResult {
  tasks: Array<{
    id: string;
    title: string;
    status: { name: string; color: string };
    list?: { id: string; name: string };
  }>;
  lists: Array<{
    id: string;
    name: string;
    space?: { id: string; name: string };
    _count?: { tasks: number };
  }>;
  spaces: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export function SearchCommand() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Listen for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Perform search
  useEffect(() => {
    if (!debouncedQuery || !currentWorkspace?.id) {
      setResults(null);
      return;
    }

    const doSearch = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}&workspaceId=${currentWorkspace.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        // Silently fail search
      } finally {
        setIsSearching(false);
      }
    };

    doSearch();
  }, [debouncedQuery, currentWorkspace?.id]);

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      setResults(null);
      router.push(path);
    },
    [router]
  );

  const hasResults =
    results &&
    (results.tasks.length > 0 ||
      results.lists.length > 0 ||
      results.spaces.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Rechercher tâches, listes, espaces..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!query && (
          <CommandGroup heading="Actions rapides">
            <CommandItem onSelect={() => handleSelect("/dashboard")}>
              <Clock className="mr-2 h-4 w-4" />
              Aller au tableau de bord
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/notifications")}>
              <Clock className="mr-2 h-4 w-4" />
              Voir les notifications
            </CommandItem>
          </CommandGroup>
        )}

        {query && !isSearching && !hasResults && (
          <CommandEmpty>Aucun résultat pour &quot;{query}&quot;</CommandEmpty>
        )}

        {query && isSearching && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Recherche en cours...
          </div>
        )}

        {results && results.tasks.length > 0 && (
          <CommandGroup heading="Tâches">
            {results.tasks.map((task) => (
              <CommandItem
                key={task.id}
                value={`task-${task.id}-${task.title}`}
                onSelect={() => handleSelect(`/tasks/${task.id}`)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: task.status.color }}
                  />
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{task.title}</span>
                  {task.list && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      dans {task.list.name}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results && results.lists.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Listes">
              {results.lists.map((list) => (
                <CommandItem
                  key={list.id}
                  value={`list-${list.id}-${list.name}`}
                  onSelect={() => handleSelect(`/lists/${list.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{list.name}</span>
                    {list.space && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        dans {list.space.name}
                      </span>
                    )}
                    {list._count && (
                      <span className="text-xs text-muted-foreground">
                        {list._count.tasks} tâches
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results && results.spaces.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Espaces">
              {results.spaces.map((space) => (
                <CommandItem
                  key={space.id}
                  value={`space-${space.id}-${space.name}`}
                  onSelect={() => handleSelect(`/spaces/${space.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 shrink-0 rounded"
                      style={{ backgroundColor: space.color }}
                    />
                    <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{space.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
