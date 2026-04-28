"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  type: "task" | "list" | "space";
  targetId: string;
  workspaceId: string | null | undefined;
  size?: "sm" | "md";
}

export function FavoriteButton({ type, targetId, workspaceId, size = "sm" }: FavoriteButtonProps) {
  const { isFavorited, toggleFavorite } = useFavorites(workspaceId);
  const active = isFavorited(type, targetId);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "shrink-0",
        size === "sm" ? "h-7 w-7" : "h-8 w-8"
      )}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(type, targetId);
      }}
    >
      <Star
        className={cn(
          size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
          active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
        )}
      />
    </Button>
  );
}
