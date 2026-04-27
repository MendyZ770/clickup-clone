"use client";

import { useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  format,
} from "date-fns";
import { Clock, TrendingUp } from "lucide-react";
import { useTimeReport } from "@/hooks/use-time-entries";
import { formatSecondsShort } from "./timer-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TimeReportProps {
  workspaceId?: string;
}

export function TimeReport({ workspaceId }: TimeReportProps) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  // Weekly report by date
  const { report: weeklyReport } = useTimeReport({
    workspaceId,
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
    groupBy: "date",
  });

  // Today's report by task
  const { report: todayReport } = useTimeReport({
    workspaceId,
    startDate: dayStart.toISOString(),
    endDate: dayEnd.toISOString(),
    groupBy: "task",
  });

  // Weekly report by task
  const { report: weeklyByTask } = useTimeReport({
    workspaceId,
    startDate: weekStart.toISOString(),
    endDate: weekEnd.toISOString(),
    groupBy: "task",
  });

  // Build chart data for the week
  const chartData = useMemo(() => {
    if (!weeklyReport) return [];

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dateMap = new Map<string, number>();

    for (const item of weeklyReport.breakdown) {
      dateMap.set(item.key, item.totalSeconds);
    }

    // Generate all 7 days of the week
    return days.map((day, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const key = format(d, "yyyy-MM-dd");
      const seconds = dateMap.get(key) ?? 0;
      return {
        day,
        hours: Math.round((seconds / 3600) * 100) / 100,
        seconds,
      };
    });
  }, [weeklyReport, weekStart]);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatSecondsShort(todayReport?.totalSeconds ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {todayReport?.totalEntries ?? 0} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatSecondsShort(weeklyReport?.totalSeconds ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {weeklyReport?.totalEntries ?? 0} entries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Time by Day
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}h`}
                />
                <Tooltip
                  formatter={(value) => [`${value}h`, "Hours"]}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                  }}
                />
                <Bar
                  dataKey="hours"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown by task */}
      {weeklyByTask && weeklyByTask.breakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              By Task (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weeklyByTask.breakdown.slice(0, 10).map((item) => {
                const percentage =
                  weeklyByTask.totalSeconds > 0
                    ? Math.round(
                        (item.totalSeconds / weeklyByTask.totalSeconds) * 100
                      )
                    : 0;
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[200px]">
                        {item.label}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatSecondsShort(item.totalSeconds)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
