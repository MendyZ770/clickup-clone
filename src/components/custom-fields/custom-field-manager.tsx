"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Trash2,
  Plus,
  GripVertical,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { getFieldTypeIcon } from "./custom-field-renderer";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "currency", label: "Currency" },
  { value: "rating", label: "Rating" },
];

interface CustomField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options: string | null;
  order: number;
}

interface CustomFieldManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  onFieldsChanged: () => void;
}

export function CustomFieldManager({
  open,
  onOpenChange,
  workspaceId,
  onFieldsChanged,
}: CustomFieldManagerProps) {
  const { data: fields, mutate } = useSWR<CustomField[]>(
    open ? `/api/custom-fields?workspaceId=${workspaceId}` : null,
    fetcher
  );

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        name: newName.trim(),
        type: newType,
        required: newRequired,
        workspaceId,
      };
      if (newType === "dropdown" && newOptions.trim()) {
        body.options = newOptions
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);
      }
      await fetch("/api/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setNewName("");
      setNewType("text");
      setNewRequired(false);
      setNewOptions("");
      setShowAdd(false);
      mutate();
      onFieldsChanged();
    } catch (error) {
      console.error("Failed to create field:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (fieldId: string) => {
    setDeleting(fieldId);
    try {
      await fetch(`/api/custom-fields/${fieldId}`, { method: "DELETE" });
      mutate();
      onFieldsChanged();
    } catch (error) {
      console.error("Failed to delete field:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleRequired = async (field: CustomField) => {
    try {
      await fetch(`/api/custom-fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ required: !field.required }),
      });
      mutate();
      onFieldsChanged();
    } catch (error) {
      console.error("Failed to update field:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Custom Fields</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {!fields || fields.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No custom fields yet. Add one below.
            </p>
          ) : (
            fields.map((field) => {
              const Icon = getFieldTypeIcon(field.type);
              const parsedOptions = field.options
                ? (() => { try { return JSON.parse(field.options) as string[]; } catch { return []; } })()
                : [];

              return (
                <div
                  key={field.id}
                  className="flex items-center gap-2 rounded-md border p-2 group"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{field.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}
                      {field.required && " (required)"}
                      {parsedOptions.length > 0 && ` - ${parsedOptions.length} options`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => handleToggleRequired(field)}
                      title={field.required ? "Make optional" : "Make required"}
                    >
                      <span className={cn("text-xs font-bold", field.required && "text-red-500")}>
                        *
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(field.id)}
                      disabled={deleting === field.id}
                    >
                      {deleting === field.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Separator />

        {showAdd ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Field Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Priority Score"
                className="h-8"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Field Type</Label>
              <div className="grid grid-cols-5 gap-1">
                {FIELD_TYPES.map((t) => {
                  const TypeIcon = getFieldTypeIcon(t.value);
                  return (
                    <button
                      key={t.value}
                      onClick={() => setNewType(t.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-md border p-2 text-xs hover:bg-muted transition-colors",
                        newType === t.value &&
                          "border-primary bg-primary/5 text-primary"
                      )}
                    >
                      <TypeIcon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {newType === "dropdown" && (
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Options (comma-separated)
                </Label>
                <Input
                  value={newOptions}
                  onChange={(e) => setNewOptions(e.target.value)}
                  placeholder="Option A, Option B, Option C"
                  className="h-8"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="required"
                checked={newRequired}
                onCheckedChange={(checked) =>
                  setNewRequired(checked === true)
                }
              />
              <label htmlFor="required" className="text-xs">
                Required field
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                size="sm"
                className="h-8"
              >
                {creating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Plus className="h-3 w-3 mr-1" />
                )}
                Create Field
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAdd(false);
                  setNewName("");
                  setNewType("text");
                  setNewOptions("");
                  setNewRequired(false);
                }}
                size="sm"
                className="h-8"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowAdd(true)}
            className="w-full"
            size="sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Custom Field
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
