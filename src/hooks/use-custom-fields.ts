"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

export function useCustomFieldsSidebar(taskId: string, workspaceId: string) {
  const { data: fields } = useSWR<CustomField[]>(
    `/api/custom-fields?workspaceId=${workspaceId}`,
    fetcher
  );

  const { data: values, mutate: mutateValues } = useSWR<CustomFieldValue[]>(
    `/api/tasks/${taskId}/custom-fields`,
    fetcher
  );

  const valueMap = useMemo(() => {
    const map = new Map<string, string>();
    if (values) {
      for (const v of values) {
        map.set(v.fieldId, v.value);
      }
    }
    return map;
  }, [values]);

  const handleChange = useCallback(
    async (fieldId: string, value: string | null) => {
      try {
        await fetch(`/api/tasks/${taskId}/custom-fields`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldId, value }),
        });
        mutateValues();
      } catch (error) {
        console.error("Failed to update custom field:", error);
      }
    },
    [taskId, mutateValues]
  );

  return {
    fields: fields ?? [],
    values: values ?? [],
    valueMap,
    handleChange,
  };
}
