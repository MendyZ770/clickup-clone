"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CommentFormProps {
  taskId: string;
  onCommentAdded?: () => void;
}

export function CommentForm({ taskId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        setContent("");
        onCommentAdded?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="min-h-[80px] text-sm resize-none"
        disabled={isSubmitting}
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
          <Send className="h-3.5 w-3.5" />
          {isSubmitting ? "Sending..." : "Comment"}
        </Button>
      </div>
    </div>
  );
}
