"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import useSWR from "swr";
import { Paperclip, Trash2, Plus, ExternalLink, Loader2, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch");
    return r.json();
  });

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  return File;
}

export function TaskAttachments({ taskId }: { taskId: string }) {
  const { data: attachments, mutate } = useSWR<Attachment[]>(
    `/api/tasks/${taskId}/attachments`,
    fetcher
  );
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return;
    setAdding(true);
    try {
      await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, type: "link" }),
      });
      setName("");
      setUrl("");
      setOpen(false);
      mutate();
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks/${taskId}/attachments?id=${id}`, { method: "DELETE" });
    mutate();
  };

  const items = attachments ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" />
          Pièces jointes ({items.length})
        </h4>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
              <Plus className="h-3 w-3" />
              Ajouter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-2" align="end">
            <p className="text-sm font-medium">Ajouter un lien</p>
            <Input placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" />
            <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} className="h-8 text-xs" />
            <Button size="sm" className="w-full text-xs" onClick={handleAdd} disabled={adding || !name || !url}>
              {adding && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Ajouter
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((att) => {
            const Icon = getFileIcon(att.mimeType);
            return (
              <div key={att.id} className="flex items-center gap-2 rounded border px-2 py-1.5 text-xs group">
                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-blue-500 hover:underline flex items-center gap-1"
                >
                  {att.name}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(att.createdAt), { addSuffix: true })}
                </span>
                <button
                  onClick={() => handleDelete(att.id)}
                  className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
