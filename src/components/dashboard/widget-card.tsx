"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, GripHorizontal } from "lucide-react";

interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  onDelete?: () => void;
  isEditing?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function WidgetCard({ title, children, onDelete, isEditing, dragHandleProps }: WidgetCardProps) {
  return (
    <Card className="h-full flex flex-col shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group bg-card">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 border-b bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          {isEditing && (
            <div 
              className="cursor-move drag-handle opacity-50 hover:opacity-100 text-muted-foreground p-1 touch-none"
              {...dragHandleProps}
            >
              <GripHorizontal className="h-4 w-4" />
            </div>
          )}
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        
        {isEditing && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-1 overflow-auto">
        {children}
      </CardContent>
    </Card>
  );
}
