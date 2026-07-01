"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/hooks/use-chat";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";

interface ChatViewProps {
  listId: string;
}

export function ChatView({ listId }: ChatViewProps) {
  const { data: session } = useSession();
  const { messages, isLoading, sendMessage } = useChat(listId);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const currentText = text;
    setText("");
    await sendMessage(currentText);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  const currentUserId = session?.user?.id;

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-2">
            <span className="text-4xl">👋</span>
            <p>Soyez le premier à lancer la discussion !</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.userId === currentUserId || message.userId === "temp-user-id";
            
            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 max-w-[80%] animate-in fade-in slide-in-from-bottom-2",
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={message.user.image || ""} />
                  <AvatarFallback>{message.user.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                
                <div className={cn(
                  "flex flex-col gap-1",
                  isMe ? "items-end" : "items-start"
                )}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {isMe ? "Vous" : message.user.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">
                      {format(new Date(message.createdAt), "HH:mm")}
                    </span>
                  </div>
                  
                  <div className={cn(
                    "px-4 py-2 rounded-2xl text-sm break-words",
                    isMe 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-muted text-foreground border rounded-tl-sm"
                  )}>
                    {message.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t">
        <form onSubmit={onSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrivez votre message..."
            className="flex-1 rounded-full px-4"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full shrink-0"
            disabled={!text.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
