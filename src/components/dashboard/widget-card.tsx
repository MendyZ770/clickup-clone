"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, GripHorizontal, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  onDelete?: () => void;
  isEditing?: boolean;
}

export function WidgetCard({ title, children, onDelete, isEditing }: WidgetCardProps) {
  return (
    <Card className={cn(
      "h-full flex flex-col relative overflow-hidden group transition-all duration-300",
      "bg-card/40 backdrop-blur-xl border-primary/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
      "hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-primary/10",
      isEditing ? "ring-2 ring-primary/20 ring-offset-2 ring-offset-background" : ""
    )}>
      {/* Subtle top gradient line for premium feel */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="py-3 px-5 flex flex-row items-center justify-between space-y-0 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-3">
          {isEditing && (
            <div className="cursor-move drag-handle text-muted-foreground/50 hover:text-primary transition-colors p-1 -ml-2 rounded-md hover:bg-primary/5">
              <GripHorizontal className="h-4 w-4" />
            </div>
          )}
          <CardTitle className="text-[13px] font-semibold tracking-wide uppercase text-muted-foreground/80">
            {title}
          </CardTitle>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isEditing && onDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-auto @container">
        {children}
      </CardContent>
    </Card>
  );
}
