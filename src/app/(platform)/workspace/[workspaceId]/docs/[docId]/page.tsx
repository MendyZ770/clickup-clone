"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Check } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Import styles
import "react-quill-new/dist/quill.snow.css";

// Dynamic import for react-quill to avoid SSR issues with "document is not defined"
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false, loading: () => <div className="h-96 flex items-center justify-center border rounded-md"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> });

export default function DocEditorPage() {
  const router = useRouter();
  const params = useParams<{ workspaceId: string; docId: string }>();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch(`/api/docs/${params.docId}`);
        if (res.ok) {
          const data = await res.json();
          setTitle(data.title);
          setContent(data.content || "");
        } else {
          router.push(`/workspace/${params.workspaceId}/docs`);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoc();
  }, [params.docId, params.workspaceId, router]);

  const saveDoc = useCallback(
    async (newTitle: string, newContent: string) => {
      setIsSaving(true);
      try {
        await fetch(`/api/docs/${params.docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle, content: newContent }),
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error("Failed to save doc", error);
      } finally {
        setIsSaving(false);
      }
    },
    [params.docId]
  );

  // Auto-save logic (debounced)
  useEffect(() => {
    if (isLoading) return;
    
    const handler = setTimeout(() => {
      saveDoc(title, content);
    }, 1500); // 1.5 seconds after user stops typing

    return () => clearTimeout(handler);
  }, [title, content, saveDoc, isLoading]);

  // Toolbar options for Quill
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image", "code-block"],
      [{ color: [] }, { background: [] }],
      ["clean"],
    ],
  }), []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-background z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/workspace/${params.workspaceId}/docs`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : lastSaved ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                <span>Enregistré</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-3 md:p-8 lg:p-12">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl md:text-4xl lg:text-5xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto mb-6 md:mb-8 bg-transparent"
            placeholder="Titre du document..."
          />
          
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {/* We apply some custom styling to override Quill's defaults to match our theme better */}
            <style jsx global>{`
              .ql-container {
                font-family: inherit !important;
                font-size: 1rem !important;
              }
              .ql-toolbar {
                border-radius: 0.5rem 0.5rem 0 0 !important;
                border-color: hsl(var(--border)) !important;
                background-color: hsl(var(--muted) / 0.3);
              }
              .ql-container {
                border-radius: 0 0 0.5rem 0.5rem !important;
                border-color: hsl(var(--border)) !important;
                min-height: 400px;
              }
              .ql-editor {
                min-height: 400px;
              }
              /* Dark mode support for quill */
              .dark .ql-toolbar .ql-stroke {
                stroke: hsl(var(--foreground));
              }
              .dark .ql-toolbar .ql-fill {
                fill: hsl(var(--foreground));
              }
              .dark .ql-toolbar .ql-picker {
                color: hsl(var(--foreground));
              }
            `}</style>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              placeholder="Commencez à écrire ici..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
