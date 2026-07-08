"use client";

import { useEffect } from "react";
import { useSWRConfig } from "swr";
import { useWorkspace } from "@/providers/workspace-provider";
import { getPusherClient } from "@/lib/pusher-client";

export function PusherListener() {
  const { currentWorkspace } = useWorkspace();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!currentWorkspace?.id) return;

    const pusher = getPusherClient();
    const channelName = `workspace-${currentWorkspace.id}`;
    const channel = pusher.subscribe(channelName);

    const handleTaskChange = () => {
      // Invalidate all tasks queries
      mutate(
        (key) => typeof key === "string" && key.startsWith("/api/tasks"),
        undefined,
        { revalidate: true }
      );
    };

    channel.bind("task:created", handleTaskChange);
    channel.bind("task:updated", handleTaskChange);
    channel.bind("task:deleted", handleTaskChange);

    return () => {
      channel.unbind("task:created", handleTaskChange);
      channel.unbind("task:updated", handleTaskChange);
      channel.unbind("task:deleted", handleTaskChange);
      pusher.unsubscribe(channelName);
    };
  }, [currentWorkspace?.id, mutate]);

  return null;
}
