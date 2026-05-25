"use client";

import { useRef, useState } from "react";
import { useUnifiedSession } from "@/hooks/use-unified-session";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  className?: string;
}

export function AvatarUpload({ className }: AvatarUploadProps) {
  const { user: sessionUser } = useUnifiedSession();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const user = sessionUser;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      toast({ title: "Avatar mis à jour" });
      window.location.reload();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible d'uploader l'avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch("/api/user/avatar", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      toast({ title: "Avatar supprimé" });
      window.location.reload();
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de supprimer l'avatar",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user?.image ?? undefined} />
          <AvatarFallback className="text-lg bg-primary/20 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="h-3.5 w-3.5" />
            Changer
          </Button>
          {user?.image && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={uploading}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP ou GIF. Max 2MB.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
