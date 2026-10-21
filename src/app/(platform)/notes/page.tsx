"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import {
  Plus,
  Pin,
  PinOff,
  Trash2,
  NotebookPen,
  Search,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";
import { apiJson, apiErrorMessage } from "@/lib/api-client";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const NOTE_COLORS = [
  { label: "Blanc", value: "#ffffff" },
  { label: "Jaune", value: "#fef9c3" },
  { label: "Vert", value: "#dcfce7" },
  { label: "Bleu", value: "#dbeafe" },
  { label: "Rose", value: "#fce7f3" },
  { label: "Violet", value: "#ede9fe" },
  { label: "Orange", value: "#ffedd5" },
  { label: "Gris", value: "#f3f4f6" },
];

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

export default function NotesPage() {
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();

  const { data: notes, isLoading, error, mutate } = useSWR<Note[]>(
    currentWorkspace ? `/api/notes?workspaceId=${currentWorkspace.id}` : null,
    fetcher
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  // Editor state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editColor, setEditColor] = useState("#ffffff");
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<{ title: string; content: string; color: string }>({
    title: "",
    content: "",
    color: "",
  });

  const selectedNote = notes?.find((n) => n.id === selectedId) ?? null;

  // Quand on sélectionne une note
  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditColor(selectedNote.color);
      lastSaved.current = {
        title: selectedNote.title,
        content: selectedNote.content,
        color: selectedNote.color,
      };
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave
  const saveNote = useCallback(
    async (id: string, title: string, content: string, color: string) => {
      if (
        title === lastSaved.current.title &&
        content === lastSaved.current.content &&
        color === lastSaved.current.color
      ) return;

      setSaving(true);
      try {
        await apiJson(`/api/notes/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ title, content, color }),
        });
        lastSaved.current = { title, content, color };
        mutate();
      } catch (error) {
        toast({ title: "Enregistrement impossible", description: apiErrorMessage(error), variant: "destructive" });
      } finally {
        setSaving(false);
      }
    },
    [mutate, toast]
  );

  const scheduleAutosave = useCallback(
    (title: string, content: string, color: string) => {
      if (!selectedId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveNote(selectedId, title, content, color);
      }, 800);
    },
    [selectedId, saveNote]
  );

  // Conserve les dernières valeurs pour le flush au démontage / à la fermeture
  const latestEdit = useRef({ selectedId, editTitle, editContent, editColor });
  useEffect(() => {
    latestEdit.current = { selectedId, editTitle, editContent, editColor };
  });

  useEffect(() => {
    const flushOnHide = () => {
      const snapshot = latestEdit.current;
      if (snapshot.selectedId) {
        void saveNote(
          snapshot.selectedId,
          snapshot.editTitle,
          snapshot.editContent,
          snapshot.editColor
        );
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushOnHide();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", flushOnHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", flushOnHide);
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      flushOnHide();
    };
  }, [saveNote]);

  // Flush save avant de changer de note
  const flushSave = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (selectedId) {
      await saveNote(selectedId, editTitle, editContent, editColor);
    }
  }, [selectedId, editTitle, editContent, editColor, saveNote]);

  const handleCreate = async () => {
    if (!currentWorkspace || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          title: "Sans titre",
          content: "",
        }),
      });
      if (!res.ok) throw new Error("Erreur");
      const note: Note = await res.json();
      await mutate();
      setSelectedId(note.id);
    } catch {
      toast({ title: "Erreur", description: "Impossible de créer", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleSelectNote = async (note: Note) => {
    if (note.id === selectedId) return;
    await flushSave();
    setSelectedId(note.id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiJson(`/api/notes/${deleteTarget.id}`, { method: "DELETE" });
      if (selectedId === deleteTarget.id) setSelectedId(null);
      mutate();
      toast({ title: "Note supprimée" });
    } catch (error) {
      toast({ title: "Erreur", description: apiErrorMessage(error), variant: "destructive" });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleTogglePin = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiJson(`/api/notes/${note.id}`, {
        method: "PATCH",
        body: JSON.stringify({ pinned: !note.pinned }),
      });
      mutate();
    } catch (error) {
      toast({ title: "Erreur", description: apiErrorMessage(error), variant: "destructive" });
    }
  };

  const handleColorChange = (color: string) => {
    setEditColor(color);
    scheduleAutosave(editTitle, editContent, color);
  };

  const filtered = (notes ?? []).filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((n) => n.pinned);
  const unpinned = filtered.filter((n) => !n.pinned);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar liste de notes — cachée sur mobile quand une note est ouverte */}
      <div className={`${selectedId ? "hidden md:flex" : "flex"} w-full md:w-72 md:shrink-0 border-r flex-col overflow-hidden`}>
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">Notes</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleCreate}
              disabled={creating}
              aria-label="Nouvelle note"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              aria-label="Rechercher dans les notes"
              className="pl-7 h-7 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {isLoading && (
            <div className="flex items-center justify-center py-6" role="status" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="sr-only">Chargement des notes</span>
            </div>
          )}

          {error && (
            <div className="px-3 py-4" role="alert">
              <p className="text-xs text-destructive">Impossible de charger les notes.</p>
              <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => mutate()}>
                Réessayer
              </Button>
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="px-3 py-6 text-center">
              <p className="text-xs text-muted-foreground">
                {search ? "Aucun résultat" : "Aucune note"}
              </p>
            </div>
          )}

          {pinned.length > 0 && (
            <>
              <div className="px-3 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Épinglées
                </span>
              </div>
              {pinned.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  selected={selectedId === note.id}
                  onSelect={() => handleSelectNote(note)}
                  onPin={(e) => handleTogglePin(note, e)}
                  onDelete={(e) => { e.stopPropagation(); setDeleteTarget(note); }}
                />
              ))}
            </>
          )}

          {unpinned.length > 0 && (
            <>
              {pinned.length > 0 && (
                <div className="px-3 py-1 mt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Autres
                  </span>
                </div>
              )}
              {unpinned.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  selected={selectedId === note.id}
                  onSelect={() => handleSelectNote(note)}
                  onPin={(e) => handleTogglePin(note, e)}
                  onDelete={(e) => { e.stopPropagation(); setDeleteTarget(note); }}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Zone d'édition */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedNote ? (
          <div
            className="flex-1 flex flex-col overflow-hidden transition-colors"
            style={{ backgroundColor: editColor + "20" }} // légère teinte
          >
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-background/80 backdrop-blur-sm">
              {/* Bouton retour mobile */}
              <button
                onClick={() => setSelectedId(null)}
                className="md:hidden flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mr-1"
              >
                ← Notes
              </button>
              {/* Palette couleurs */}
              <div className="flex items-center gap-1 flex-wrap">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handleColorChange(c.value)}
                    aria-label={`Couleur ${c.label}`}
                    aria-pressed={editColor === c.value}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                      editColor === c.value
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>

              <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                {!saving && (
                  <span>
                    {"Modifié "}
                    {format(new Date(selectedNote.updatedAt), "d MMM à HH:mm", { locale: fr })}
                  </span>
                )}
              </div>
            </div>

            {/* Éditeur */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-3xl mx-auto w-full">
              {/* Titre */}
              <input
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  scheduleAutosave(e.target.value, editContent, editColor);
                }}
                placeholder="Sans titre"
                aria-label="Titre de la note"
                className="w-full bg-transparent text-2xl md:text-3xl font-bold outline-none placeholder:text-muted-foreground/40 mb-4"
                maxLength={200}
              />

              {/* Contenu */}
              <Textarea
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                  scheduleAutosave(editTitle, e.target.value, editColor);
                }}
                placeholder="Commencez à écrire..."
                aria-label="Contenu de la note"
                className="w-full min-h-[60vh] bg-transparent border-none resize-none outline-none text-sm leading-relaxed focus-visible:ring-0 p-0"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={NotebookPen}
              title="Aucune note sélectionnée"
              description="Créez une note ou sélectionnez-en une pour commencer."
              actionLabel="Nouvelle note"
              onAction={handleCreate}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Supprimer la note"
        description={`Êtes-vous sûr de vouloir supprimer "${deleteTarget?.title}" ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}

function NoteItem({
  note,
  selected,
  onSelect,
  onPin,
  onDelete,
}: {
  note: Note;
  selected: boolean;
  onSelect: () => void;
  onPin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group w-full flex items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50 cursor-pointer",
        selected && "bg-muted"
      )}
    >
      <div
        className="mt-1 h-3 w-3 shrink-0 rounded-full border border-border"
        style={{ backgroundColor: note.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {note.title || "Sans titre"}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {note.content || "Vide"}
        </p>
      </div>
      <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onPin}
          aria-label={note.pinned ? "Désépingler la note" : "Épingler la note"}
          className="p-2 rounded hover:bg-muted-foreground/20"
        >
          {note.pinned ? (
            <PinOff className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <Pin className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Supprimer la note"
          className="p-2 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
