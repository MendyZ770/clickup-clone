"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { Settings2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomFieldRenderer, getFieldTypeIcon } from "./custom-field-renderer";
import { CustomFieldManager } from "./custom-field-manager";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface CustomField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options: string | null;
  defaultValue: string | null;
  order: number;
  workspaceId: string;
}

interface CustomFieldValue {
  id: string;
  value: string;
  fieldId: string;
  taskId: string;
  field: CustomField;
}

interface CustomFieldsSectionProps {
  taskId: string;
  workspaceId: string;
}

export function CustomFieldsSection({
  taskId,
  workspaceId,
}: CustomFieldsSectionProps) {
  const [managerOpen, setManagerOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Fetch all workspace custom fields
  const { data: fields, mutate: mutateFields } = useSWR<CustomField[]>(
    `/api/custom-fields?workspaceId=${workspaceId}`,
    fetcher
  );

  // Fetch values for this task
  const { data: values, mutate: mutateValues } = useSWR<CustomFieldValue[]>(
    `/api/tasks/${taskId}/custom-fields`,
    fetcher
  );

  const handleChange = useCallback(
    async (fieldId: string, value: string | null) => {
      setSaving(fieldId);
      try {
        await fetch(`/api/tasks/${taskId}/custom-fields`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldId, value }),
        });
        mutateValues();
      } catch (error) {
        console.error("Failed to update custom field:", error);
      } finally {
        setSaving(null);
      }
    },
    [taskId, mutateValues]
  );

  if (!fields || fields.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Custom Fields</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setManagerOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Field
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          No custom fields defined for this workspace.
        </p>
        <CustomFieldManager
          open={managerOpen}
          onOpenChange={setManagerOpen}
          workspaceId={workspaceId}
          onFieldsChanged={() => mutateFields()}
        />
      </div>
    );
  }

  // Build a map of fieldId -> value
  const valueMap = new Map<string, string>();
  if (values) {
    for (const v of values) {
      valueMap.set(v.fieldId, v.value);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Custom Fields</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setManagerOpen(true)}
        >
          <Settings2 className="h-3 w-3 mr-1" />
          Manage
        </Button>
      </div>

      <div className="space-y-2">
        {fields.map((field) => {
          const Icon = getFieldTypeIcon(field.type);
          const currentValue = valueMap.get(field.id) ?? null;
          const parsedOptions = field.options
            ? (() => { try { return JSON.parse(field.options); } catch { return []; } })()
            : [];

          return (
            <div key={field.id} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3 w-3" />
                <span>{field.name}</span>
                {field.required && (
                  <span className="text-red-500">*</span>
                )}
                {saving === field.id && (
                  <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                )}
              </div>
              <CustomFieldRenderer
                fieldType={field.type}
                fieldName={field.name}
                value={currentValue}
                options={parsedOptions}
                onChange={(val) => handleChange(field.id, val)}
              />
            </div>
          );
        })}
      </div>

      <CustomFieldManager
        open={managerOpen}
        onOpenChange={setManagerOpen}
        workspaceId={workspaceId}
        onFieldsChanged={() => {
          mutateFields();
          mutateValues();
        }}
      />
    </div>
  );
}
