"use client";

import { useState } from "react";
import { BookmarkPlus, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTemplates, type TaskTemplate } from "@/hooks/use-templates";
import { useCreateTask } from "@/hooks/use-tasks";

interface TemplatePickerProps {
  workspaceId: string | undefined | null;
  listId: string;
  statusId?: string;
  onCreated?: () => void;
}

export function TemplatePicker({
  workspaceId,
  listId,
  statusId,
  onCreated,
}: TemplatePickerProps) {
  const { templates, createTemplate, deleteTemplate } = useTemplates(workspaceId);
  const { createTask } = useCreateTask();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [saving, setSaving] = useState(false);

  const handleUseTemplate = async (template: TaskTemplate) => {
    await createTask({
      title: template.name,
      description: template.description ?? undefined,
      priority: template.priority,
      listId,
      statusId,
    });
    onCreated?.();
    setOpen(false);
  };

  const handleCreateTemplate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createTemplate({
        name: newName.trim(),
        description: newDesc || undefined,
        priority: newPriority,
      });
      setNewName("");
      setNewDesc("");
      setNewPriority("normal");
      setShowCreate(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
          <BookmarkPlus className="h-3 w-3" />
          Templates
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-3 border-b">
          <p className="text-sm font-medium">Templates de tâches</p>
          <p className="text-[10px] text-muted-foreground">
            Créez des tâches à partir de modèles
          </p>
        </div>

        <div className="max-h-52 overflow-y-auto">
          {templates.length === 0 && !showCreate && (
            <div className="px-3 py-6 text-center">
              <BookmarkPlus className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Aucun template</p>
            </div>
          )}
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors group"
            >
              <button
                onClick={() => handleUseTemplate(t)}
                className="flex-1 text-left min-w-0"
              >
                <p className="text-sm font-medium truncate">{t.name}</p>
                {t.description && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {t.description}
                  </p>
                )}
              </button>
              <button
                onClick={() => deleteTemplate(t.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t p-2">
          {showCreate ? (
            <div className="space-y-2">
              <Input
                placeholder="Nom du template"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-7 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTemplate();
                  if (e.key === "Escape") setShowCreate(false);
                }}
              />
              <Input
                placeholder="Description (optionnel)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="h-7 text-xs"
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={handleCreateTemplate}
                  disabled={saving || !newName.trim()}
                >
                  {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Créer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setShowCreate(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs gap-1 justify-start"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-3 w-3" />
              Nouveau template
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
