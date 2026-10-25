"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { apiErrorMessage } from "@/lib/api-client";
import { toast } from "@/components/ui/use-toast";
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
        size === "sm" ? "h-8 w-8" : "h-9 w-9"
      )}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await toggleFavorite(type, targetId);
        } catch (error) {
          toast({
            title: "Favoris indisponibles",
            description: apiErrorMessage(error),
            variant: "destructive",
          });
        }
      }}
    >
      <Star
        className={cn(
          size === "sm" ? "h-4 w-4" : "h-5 w-5",
          active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
        )}
      />
    </Button>
  );
}
