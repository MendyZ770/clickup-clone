"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-9 w-9",
};

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)}
    />
  );
}

export function LoadingPage() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
