"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-md bg-muted",
            className
          )}
        />
      ))}
    </>
  );
}

export function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-2 border-b px-3 py-2">
      <div className="h-4 w-4 rounded bg-muted" />
      <div className="h-4 w-4 rounded-full bg-muted" />
      <div className="flex-1 h-4 rounded bg-muted" />
      <div className="hidden sm:block h-5 w-20 rounded bg-muted" />
      <div className="hidden sm:block h-5 w-16 rounded bg-muted" />
      <div className="hidden lg:flex h-5 w-24 rounded bg-muted" />
      <div className="hidden sm:block h-6 w-6 rounded-full bg-muted" />
      <div className="h-4 w-4 rounded bg-muted" />
    </div>
  );
}

export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: count }).map((_, i) => (
        <TaskRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="h-5 w-1/3 rounded bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
