"use client";

import { useParams } from "next/navigation";
import { ViewSwitcher } from "@/components/layout/view-switcher";
import { ChatView } from "@/components/views/chat-view";

export default function ChatViewPage() {
  const params = useParams<{
    workspaceId: string;
    spaceId: string;
    listId: string;
  }>();
  const { workspaceId, spaceId, listId } = params;
  const basePath = `/workspace/${workspaceId}/space/${spaceId}/list/${listId}/chat`;

  return (
    <div className="flex flex-col h-full bg-muted/10">
      <div className="flex items-center justify-between gap-2 px-2 md:px-4 py-2 border-b bg-background overflow-x-auto">
        <ViewSwitcher basePath={basePath} />
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatView listId={listId} />
      </div>
    </div>
  );
}
