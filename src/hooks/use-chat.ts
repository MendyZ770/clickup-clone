import useSWR from "swr";
import { useEffect } from "react";
import { getPusherClient } from "@/lib/pusher-client";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  listId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export function useChat(listId: string) {
  const { data, error, isLoading, mutate } = useSWR<ChatMessage[]>(
    listId ? `/api/lists/${listId}/chat` : null,
    fetcher
  );

  useEffect(() => {
    if (!listId) return;

    const pusher = getPusherClient();
    const channelName = `list-${listId}-chat`;
    const channel = pusher.subscribe(channelName);

    channel.bind("message:created", (newMessage: ChatMessage) => {
      // Avoid duplicating the optimistic message if it was sent by us
      mutate((currentMessages) => {
        if (!currentMessages) return [newMessage];
        if (currentMessages.some(m => m.id === newMessage.id)) return currentMessages;
        return [...currentMessages, newMessage];
      }, false);
    });

    return () => {
      channel.unbind("message:created");
      pusher.unsubscribe(channelName);
    };
  }, [listId, mutate]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Optimistic UI update
    const optimisticMessage: ChatMessage = {
      id: Math.random().toString(),
      text,
      createdAt: new Date().toISOString(),
      userId: "temp-user-id", // Overridden by server
      listId,
      user: {
        id: "temp-user-id",
        name: "Vous",
        image: null,
      },
    };

    mutate(data ? [...data, optimisticMessage] : [optimisticMessage], false);

    try {
      const response = await fetch(`/api/lists/${listId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      mutate(); // Revalidate with server data
    } catch (err) {
      console.error(err);
      mutate(); // Revert optimistic update on failure
    }
  };

  return {
    messages: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    sendMessage,
  };
}
