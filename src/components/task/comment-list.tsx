"use client";

import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentForm } from "./comment-form";
import { Skeleton } from "@/components/ui/skeleton";
import type { CommentWithUser } from "@/types";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface CommentListProps {
  taskId: string;
}

export function CommentList({ taskId }: CommentListProps) {
  const { data: comments, isLoading, mutate } = useSWR<CommentWithUser[]>(
    `/api/tasks/${taskId}/comments`,
    fetcher
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Comments</h3>

      <CommentForm taskId={taskId} onCommentAdded={() => mutate()} />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {(comments ?? []).map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.user.image ?? undefined} />
                <AvatarFallback className="text-xs">
                  {(comment.user.name ?? comment.user.email)
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {comment.user.name ?? comment.user.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
          {comments?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No comments yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
