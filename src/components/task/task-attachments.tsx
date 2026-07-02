"use client";

import { useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import useSWR from "swr";
import {
  Paperclip, Trash2, ExternalLink, Loader2,
  FileText, Image as ImageIcon, File, Link2, Upload, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

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

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/pdf" || mimeType.includes("document") || mimeType.includes("word")) return FileText;
  return File;
}

interface TaskAttachmentsProps {
  taskId: string;
}

export function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const { data: attachments, mutate } = useSWR<Attachment[]>(
    `/api/tasks/${taskId}/attachments`,
    fetcher
  );
  const [addingLink, setAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 20, 85));
      }, 300);

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        alert(err.error || "Upload échoué");
        return;
      }

      setUploadProgress(90);
      const { url, mimeType, size } = await uploadRes.json();

      // Create attachment record
      const attachRes = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          url,
          type: "file",
          mimeType,
          size,
        }),
      });

      if (attachRes.ok) {
        setUploadProgress(100);
        await mutate();
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) return;
    const res = await fetch(`/api/tasks/${taskId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: linkName.trim() || linkUrl,
        url: linkUrl.trim(),
        type: "link",
      }),
    });
    if (res.ok) {
      setLinkUrl("");
      setLinkName("");
      setAddingLink(false);
      await mutate();
    }
  };

  const handleDelete = async (attachmentId: string) => {
    setDeletingId(attachmentId);
    try {
      await fetch(`/api/tasks/${taskId}/attachments?attachmentId=${attachmentId}`, {
        method: "DELETE",
      });
      await mutate();
    } finally {
      setDeletingId(null);
    }
  };

  const isImageAttachment = (url: string, mimeType: string | null) =>
    mimeType?.startsWith("image/") || url.startsWith("/uploads/");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="h-4 w-4" />
          Pièces jointes {attachments && attachments.length > 0 && `(${attachments.length})`}
        </div>
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-3.5 w-3.5" />
            Fichier
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setAddingLink(true)}
            disabled={uploading}
          >
            <Link2 className="h-3.5 w-3.5" />
            Lien
          </Button>
        </div>
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Upload en cours...</p>
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}

      {/* Add link form */}
      {addingLink && (
        <div className="rounded-lg border p-3 space-y-2">
          <Input
            placeholder="URL du lien (https://...)"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            className="h-8 text-sm"
          />
          <Input
            placeholder="Nom du lien (optionnel)"
            value={linkName}
            onChange={e => setLinkName(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setAddingLink(false); setLinkUrl(""); setLinkName(""); }}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleAddLink} disabled={!linkUrl.trim()}>
              Ajouter
            </Button>
          </div>
        </div>
      )}

      {/* Attachments list */}
      {attachments && attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map(att => {
            const FileIcon = getFileIcon(att.mimeType);
            const isImage = isImageAttachment(att.url, att.mimeType);

            return (
              <div
                key={att.id}
                className="group flex items-start gap-3 rounded-lg border p-2.5 hover:bg-muted/50 transition-colors"
              >
                {/* Preview or icon */}
                <div className="shrink-0">
                  {isImage ? (
                    <div className="relative h-12 w-12 rounded overflow-hidden border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={att.url}
                        alt={att.name}
                        className="h-full w-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded border bg-muted">
                      <FileIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline truncate block"
                  >
                    {att.name}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(att.createdAt), { addSuffix: true, locale: fr })}
                    </span>
                    {att.size && (
                      <span className="text-xs text-muted-foreground">· {formatBytes(att.size)}</span>
                    )}
                    {att.user.name && (
                      <span className="text-xs text-muted-foreground">· par {att.user.name}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    asChild
                  >
                    <a href={att.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(att.id)}
                    disabled={deletingId === att.id}
                  >
                    {deletingId === att.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(!attachments || attachments.length === 0) && !uploading && !addingLink && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Aucune pièce jointe. Cliquez sur &quot;Fichier&quot; pour uploader.
        </p>
      )}
    </div>
  );
}
