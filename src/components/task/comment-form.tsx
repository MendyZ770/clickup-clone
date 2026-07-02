"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MentionTextarea } from "@/components/shared/mention-textarea";
import { useMentionMembers } from "@/hooks/use-mention-members";

interface CommentFormProps {
  taskId: string;
  workspaceId?: string;
  onCommentAdded?: () => void;
}

export function CommentForm({ taskId, workspaceId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const members = useMentionMembers(workspaceId);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, mentionedUserIds }),
      });
      if (res.ok) {
        setContent("");
        setMentionedUserIds([]);
        onCommentAdded?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <MentionTextarea
        value={content}
        onChange={setContent}
        onMentionedUsers={setMentionedUserIds}
        placeholder="Écrire un commentaire... (@ pour mentionner)"
        disabled={isSubmitting}
        members={members}
        rows={3}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          className="gap-1"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Envoi..." : "Commenter"}
        </Button>
      </div>
    </div>
  );
}
