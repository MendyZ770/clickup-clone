"use client";

import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from "date-fns";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  DollarSign,
} from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { formatSeconds, formatSecondsShort } from "@/components/time-tracking/timer-display";
import { TimeReport } from "@/components/time-tracking/time-report";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { TimeEntryWithDetails } from "@/types";

export default function TimeTrackingPage() {
  const { currentWorkspace } = useWorkspace();
  const [weekOffset, setWeekOffset] = useState(0);
  const [billableFilter, setBillableFilter] = useState<"all" | "billable" | "non-billable">("all");

  const now = new Date();
  const currentWeekStart = startOfWeek(
    weekOffset === 0 ? now : weekOffset > 0 ? addWeeks(now, weekOffset) : subWeeks(now, Math.abs(weekOffset)),
    { weekStartsOn: 1 }
  );
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  const { entries, isLoading } = useTimeEntries();

  // Filter entries for the selected week
  const weekEntries = useMemo(() => {
    if (!entries) return [];
    return entries.filter((entry: TimeEntryWithDetails) => {
      const entryDate = new Date(entry.startTime);
      const inWeek = entryDate >= currentWeekStart && entryDate <= currentWeekEnd;
      if (!inWeek) return false;
      if (billableFilter === "billable" && !entry.billable) return false;
      if (billableFilter === "non-billable" && entry.billable) return false;
      return true;
    });
  }, [entries, currentWeekStart, currentWeekEnd, billableFilter]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, TimeEntryWithDetails[]>();
    for (const entry of weekEntries) {
      if (entry.duration == null) continue;
      const dateKey = format(new Date(entry.startTime), "yyyy-MM-dd");
      const existing = groups.get(dateKey) ?? [];
      existing.push(entry);
      groups.set(dateKey, existing);
    }
    // Sort by date descending
    return Array.from(groups.entries()).sort(
      (a, b) => b[0].localeCompare(a[0])
    );
  }, [weekEntries]);

  const weekTotal = weekEntries
    .filter((e: TimeEntryWithDetails) => e.duration != null)
    .reduce((sum: number, e: TimeEntryWithDetails) => sum + (e.duration ?? 0), 0);

  const billableTotal = weekEntries
    .filter((e: TimeEntryWithDetails) => e.duration != null && e.billable)
    .reduce((sum: number, e: TimeEntryWithDetails) => sum + (e.duration ?? 0), 0);

  const handleExport = () => {
    const rows = [
      ["Date", "Task", "Description", "Duration (HH:MM:SS)", "Billable", "User"],
    ];
    for (const entry of weekEntries) {
      if (entry.duration == null) continue;
      rows.push([
        format(new Date(entry.startTime), "yyyy-MM-dd"),
        entry.task.title,
        entry.description ?? "",
        formatSeconds(entry.duration),
        entry.billable ? "Yes" : "No",
        entry.user.name ?? entry.user.email,
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `time-tracking-${format(currentWeekStart, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary shrink-0" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Time Tracking</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Track and manage your time across all tasks
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 self-start sm:self-auto">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Week navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setWeekOffset((o) => o - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm font-medium min-w-[160px] sm:min-w-[200px] text-center">
              {format(currentWeekStart, "MMM d")} -{" "}
              {format(currentWeekEnd, "MMM d, yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setWeekOffset((o) => o + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {weekOffset !== 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setWeekOffset(0)}
              >
                Today
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select value={billableFilter} onValueChange={(v) => setBillableFilter(v as typeof billableFilter)}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <Filter className="h-3 w-3 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entries</SelectItem>
                <SelectItem value="billable">Billable only</SelectItem>
                <SelectItem value="non-billable">Non-billable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">
                Total This Week
              </p>
              <p className="text-2xl font-bold font-mono">
                {formatSecondsShort(weekTotal)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Billable
              </p>
              <p className="text-2xl font-bold font-mono text-green-600">
                {formatSecondsShort(billableTotal)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Entries</p>
              <p className="text-2xl font-bold">
                {weekEntries.filter((e: TimeEntryWithDetails) => e.duration != null).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Charts */}
        <TimeReport workspaceId={currentWorkspace?.id} />

        <Separator />

        {/* Entries grouped by date */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">Time Entries</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-md bg-muted/50"
                />
              ))}
            </div>
          ) : groupedEntries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No time entries for this week.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a timer on any task to begin tracking time.
              </p>
            </div>
          ) : (
            groupedEntries.map(([dateKey, dayEntries]) => {
              const dayTotal = dayEntries.reduce(
                (sum, e) => sum + (e.duration ?? 0),
                0
              );
              return (
                <div key={dateKey} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {format(new Date(dateKey + "T12:00:00"), "EEEE, MMM d")}
                    </span>
                    <span className="text-xs font-mono font-medium">
                      {formatSecondsShort(dayTotal)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2 md:gap-3 rounded-md border px-2 md:px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                      >
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={entry.user.image ?? undefined} />
                          <AvatarFallback className="text-[9px]">
                            {(entry.user.name ?? entry.user.email)?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {entry.task.title}
                            </span>
                            {entry.billable && (
                              <Badge
                                variant="outline"
                                className="h-4 px-1 text-[9px] text-green-600 border-green-600/30"
                              >
                                $
                              </Badge>
                            )}
                          </div>
                          {entry.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {entry.description}
                            </p>
                          )}
                        </div>

                        <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
                          {format(new Date(entry.startTime), "h:mm a")}
                          {entry.endTime &&
                            ` - ${format(new Date(entry.endTime), "h:mm a")}`}
                        </span>

                        <span className="font-mono text-xs font-semibold tabular-nums shrink-0 min-w-[60px] text-right">
                          {formatSeconds(entry.duration ?? 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
