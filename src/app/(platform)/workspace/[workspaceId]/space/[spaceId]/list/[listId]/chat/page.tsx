"use client";

import { useParams } from "next/navigation";
import { ViewSwitcher } from "@/components/layout/view-switcher";
import { ChatView } from "@/components/views/chat-view";

export default function ChatPage() {
  const params = useParams<{
    workspaceId: string;
    spaceId: string;
    listId: string;
  }>();
  const { workspaceId, spaceId, listId } = params;
  const basePath = `/workspace/${workspaceId}/space/${spaceId}/list/${listId}/chat`;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between gap-2 px-2 md:px-4 py-2 border-b overflow-x-auto shrink-0 bg-background z-10">
        <ViewSwitcher basePath={basePath} />
      </div>
      <div className="flex-1 overflow-hidden relative">
        <ChatView listId={listId} />
      </div>
    </div>
  );
}
