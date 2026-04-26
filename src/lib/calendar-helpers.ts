import ical, { ICalCalendarMethod, ICalEventStatus, ICalAlarmType } from "ical-generator";

interface CalendarTask {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  dueDate: Date;
  status: {
    name: string;
    type: string;
  };
  list: {
    name: string;
    space: {
      name: string;
      workspace: {
        name: string;
      };
    };
  };
}

/**
 * Map task priority string to iCal priority (1-9 scale).
 * 1 = highest, 5 = normal, 9 = lowest
 */
export function mapPriorityToICal(priority: string): number {
  switch (priority) {
    case "urgent":
      return 1;
    case "high":
      return 3;
    case "normal":
      return 5;
    case "low":
      return 7;
    default:
      return 5;
  }
}

/**
 * Map task status type to iCal VEVENT status
 */
export function mapStatusToICal(statusType: string): ICalEventStatus {
  switch (statusType) {
    case "done":
    case "closed":
      return ICalEventStatus.CONFIRMED;
    case "active":
    case "in_progress":
      return ICalEventStatus.TENTATIVE;
    default:
      return ICalEventStatus.TENTATIVE;
  }
}

/**
 * Get a color hex code based on priority
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent":
      return "#EF4444";
    case "high":
      return "#F97316";
    case "normal":
      return "#3B82F6";
    case "low":
      return "#6B7280";
    default:
      return "#3B82F6";
  }
}

/**
 * Create ICS calendar content from a list of tasks
 */
export function createICSFromTasks(
  tasks: CalendarTask[],
  calendarName: string = "ClickUp Clone Tasks",
  baseUrl: string = process.env.NEXTAUTH_URL || "http://localhost:3000"
) {
  const calendar = ical({
    name: calendarName,
    method: ICalCalendarMethod.PUBLISH,
    prodId: { company: "clickup-clone", product: "task-calendar" },
    timezone: "UTC",
  });

  for (const task of tasks) {
    const dueDate = new Date(task.dueDate);
    const isAllDay =
      dueDate.getHours() === 0 &&
      dueDate.getMinutes() === 0 &&
      dueDate.getSeconds() === 0;

    const description = [
      task.description || "",
      "",
      `Priority: ${task.priority}`,
      `Status: ${task.status.name}`,
      `List: ${task.list.name}`,
      `Space: ${task.list.space.name}`,
      `Workspace: ${task.list.space.workspace.name}`,
      "",
      `View task: ${baseUrl}/task/${task.id}`,
    ].join("\n");

    const event = calendar.createEvent({
      id: `task-${task.id}@clickup-clone`,
      summary: task.title,
      description,
      start: dueDate,
      allDay: isAllDay,
      end: isAllDay ? undefined : new Date(dueDate.getTime() + 60 * 60 * 1000),
      categories: [{ name: task.priority }],
      status: mapStatusToICal(task.status.type),
      url: `${baseUrl}/task/${task.id}`,
      priority: mapPriorityToICal(task.priority),
    });

    // Add alarm for urgent and high priority tasks (1 hour before)
    if (task.priority === "urgent" || task.priority === "high") {
      event.createAlarm({
        type: ICalAlarmType.display,
        trigger: -3600, // 1 hour before in seconds
        description: `Reminder: ${task.title} is due soon`,
      });
    }
  }

  return calendar;
}

/**
 * Create a Google Calendar event object from a task
 */
export function createGoogleCalendarEvent(task: CalendarTask, baseUrl: string = process.env.NEXTAUTH_URL || "http://localhost:3000") {
  const dueDate = new Date(task.dueDate);
  const isAllDay =
    dueDate.getHours() === 0 &&
    dueDate.getMinutes() === 0 &&
    dueDate.getSeconds() === 0;

  const description = [
    task.description || "",
    "",
    `Priority: ${task.priority}`,
    `Status: ${task.status.name}`,
    `List: ${task.list.name}`,
    "",
    `View task: ${baseUrl}/task/${task.id}`,
  ].join("\n");

  const colorId = getGoogleCalendarColorId(task.priority);

  if (isAllDay) {
    const dateStr = dueDate.toISOString().split("T")[0];
    const nextDay = new Date(dueDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const endDateStr = nextDay.toISOString().split("T")[0];

    return {
      summary: task.title,
      description,
      start: { date: dateStr },
      end: { date: endDateStr },
      colorId,
      source: {
        title: "ClickUp Clone",
        url: `${baseUrl}/task/${task.id}`,
      },
      reminders:
        task.priority === "urgent" || task.priority === "high"
          ? {
              useDefault: false,
              overrides: [{ method: "popup" as const, minutes: 60 }],
            }
          : { useDefault: true },
      extendedProperties: {
        private: {
          clickupCloneTaskId: task.id,
        },
      },
    };
  }

  return {
    summary: task.title,
    description,
    start: { dateTime: dueDate.toISOString(), timeZone: "UTC" },
    end: {
      dateTime: new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: "UTC",
    },
    colorId,
    source: {
      title: "ClickUp Clone",
      url: `${baseUrl}/task/${task.id}`,
    },
    reminders:
      task.priority === "urgent" || task.priority === "high"
        ? {
            useDefault: false,
            overrides: [{ method: "popup" as const, minutes: 60 }],
          }
        : { useDefault: true },
    extendedProperties: {
      private: {
        clickupCloneTaskId: task.id,
      },
    },
  };
}

/**
 * Map priority to Google Calendar color ID
 * See: https://developers.google.com/calendar/api/v3/reference/colors
 */
function getGoogleCalendarColorId(priority: string): string {
  switch (priority) {
    case "urgent":
      return "11"; // Red
    case "high":
      return "6"; // Orange
    case "normal":
      return "9"; // Blue
    case "low":
      return "8"; // Gray
    default:
      return "9";
  }
}
