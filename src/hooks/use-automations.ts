import useSWR from "swr";
import type { Automation } from "@prisma/client";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAutomations(listId?: string) {
  const { data, error, isLoading, mutate } = useSWR<Automation[]>(
    listId ? `/api/automations?listId=${listId}` : null,
    fetcher
  );

  const createAutomation = async (payload: {
    listId: string;
    name: string;
    triggerType: string;
    triggerCondition: any;
    actionType: string;
    actionPayload: any;
  }) => {
    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create automation");
    mutate();
    return res.json();
  };

  const deleteAutomation = async (id: string) => {
    const res = await fetch(`/api/automations/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete automation");
    mutate();
  };

  return {
    automations: data || [],
    isLoading,
    isError: error,
    createAutomation,
    deleteAutomation,
  };
}
