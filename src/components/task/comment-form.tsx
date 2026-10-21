"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { MentionTextarea } from "@/components/shared/mention-textarea";
import { useMentionMembers } from "@/hooks/use-mention-members";
import { apiJson, apiErrorMessage } from "@/lib/api-client";

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
      await apiJson(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: trimmed, mentionedUserIds }),
      });
      setContent("");
      setMentionedUserIds([]);
      onCommentAdded?.();
    } catch (error) {
      toast({ title: "Envoi impossible", description: apiErrorMessage(error), variant: "destructive" });
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
