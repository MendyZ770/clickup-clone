export const DEFAULT_STATUSES = [
  { name: "To Do", color: "#D2D5DA", type: "todo", order: 0 },
  { name: "In Progress", color: "#FFA500", type: "in_progress", order: 1 },
  { name: "Review", color: "#A855F7", type: "review", order: 2 },
  { name: "Done", color: "#16A34A", type: "done", order: 3 },
  { name: "Closed", color: "#6B7280", type: "closed", order: 4 },
] as const;

export const PRIORITY_LEVELS = [
  { value: "urgent", label: "Urgent", color: "#EF4444", icon: "🔴" },
  { value: "high", label: "High", color: "#F97316", icon: "🟠" },
  { value: "normal", label: "Normal", color: "#3B82F6", icon: "🔵" },
  { value: "low", label: "Low", color: "#6B7280", icon: "⚪" },
] as const;

export const SIDEBAR_COLORS = [
  "#7C3AED", // Purple (default workspace)
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#14B8A6", // Teal
] as const;

export const SPACE_ICONS = [
  "folder",
  "star",
  "heart",
  "zap",
  "target",
  "briefcase",
  "code",
  "book",
  "globe",
  "settings",
] as const;
