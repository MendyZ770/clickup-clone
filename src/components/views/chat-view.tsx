"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, User as UserIcon, Loader2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MentionTextarea } from "@/components/shared/mention-textarea";
import { useMentionMembers } from "@/hooks/use-mention-members";
import Image from "next/image";

interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ChatViewProps {
  listId: string;
  workspaceId?: string;
}

/** Parse @mentions and wrap them in a styled span */
function renderWithMentions(text: string) {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    /^@\w+$/.test(part) ? (
      <span key={i} className="text-primary-foreground/80 font-semibold underline decoration-dotted">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export function ChatView({ listId, workspaceId }: ChatViewProps) {
  const { data: session } = useSession();
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const members = useMentionMembers(workspaceId);

  const { data: messages, error, isLoading, mutate } = useSWR<ChatMessage[]>(
    `/api/lists/${listId}/chat`,
    fetcher,
    { refreshInterval: 3000 } // Poll every 3 seconds for real-time feel
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/lists/${listId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, mentionedUserIds }),
      });

      if (res.ok) {
        setInputText("");
        setMentionedUserIds([]);
        mutate(); // Optimistic update could be added here, but mutate is fine for now
      }
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Erreur lors du chargement du chat.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-b-2xl max-w-4xl mx-auto w-full border-x border-b shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
        {messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Aucun message pour le moment</p>
            <p className="text-xs text-muted-foreground">
              Soyez le premier à démarrer la discussion !
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages?.map((msg) => {
              const isMe = msg.user.id === session?.user?.id;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={cn(
                    "flex gap-3",
                    isMe ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <div className="shrink-0 mt-auto mb-1">
                    {msg.user.image ? (
                      <Image
                        src={msg.user.image}
                        alt={msg.user.name ?? ""}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover shadow-sm border border-border/50"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shadow-sm border border-border/50">
                        <UserIcon className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "flex flex-col max-w-[75%]",
                      isMe ? "items-end" : "items-start"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {isMe ? "Moi" : msg.user.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {format(new Date(msg.createdAt), "HH:mm", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted/50 text-foreground border border-border/40 rounded-bl-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">
                        {renderWithMentions(msg.text)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t">
        <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
          <MentionTextarea
            value={inputText}
            onChange={setInputText}
            onMentionedUsers={setMentionedUserIds}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Écrire un message... (@ pour mentionner)"
            className="min-h-[50px] max-h-[200px] pr-12 rounded-2xl border-border/40 bg-muted/20 focus-visible:ring-primary/20 custom-scrollbar"
            rows={1}
            members={members}
            disabled={isSending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className="shrink-0 h-[50px] w-[50px] rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <div className="text-center mt-2">
          <span className="text-[10px] text-muted-foreground">
            Appuyez sur{" "}
            <kbd className="px-1 py-0.5 rounded-md bg-muted font-mono">
              Entrée
            </kbd>{" "}
            pour envoyer · <kbd className="px-1 py-0.5 rounded-md bg-muted font-mono">@</kbd> pour mentionner
          </span>
        </div>
      </div>
    </div>
  );
}
