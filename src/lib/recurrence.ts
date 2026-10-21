import { addDays, addMonths, addWeeks, addYears } from "date-fns";

export interface RecurrenceRule {
  pattern: string;
  interval: number;
  daysOfWeek?: string | null;
  dayOfMonth?: number | null;
  endDate?: Date | null;
}

export function parseDaysOfWeek(value: string | null | undefined): number[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (day): day is number =>
        Number.isInteger(day) && (day as number) >= 0 && (day as number) <= 6
    );
  } catch {
    return [];
  }
}

function keepTimeOfDay(base: Date, target: Date): Date {
  const result = new Date(target);
  result.setHours(
    base.getHours(),
    base.getMinutes(),
    base.getSeconds(),
    base.getMilliseconds()
  );
  return result;
}

function addMonthsClamped(
  base: Date,
  months: number,
  dayOfMonth?: number | null
): Date {
  const targetMonth = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const desiredDay = dayOfMonth ?? base.getDate();
  const daysInTargetMonth = new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth() + 1,
    0
  ).getDate();
  targetMonth.setDate(Math.min(desiredDay, daysInTargetMonth));
  return keepTimeOfDay(base, targetMonth);
}

/**
 * Calcule la prochaine échéance d'une règle de récurrence à partir de `from`.
 * Retourne `null` si la date de fin est dépassée ou si la règle est invalide.
 */
export function computeNextDueDate(
  rule: RecurrenceRule,
  from: Date
): Date | null {
  const interval = Math.max(1, Math.floor(rule.interval || 1));
  let next: Date;

  switch (rule.pattern) {
    case "daily":
      next = addDays(from, interval);
      break;
    case "weekly":
      next = addWeeks(from, interval);
      break;
    case "biweekly":
      next = addWeeks(from, interval * 2);
      break;
    case "monthly":
      next = addMonthsClamped(from, interval, rule.dayOfMonth);
      break;
    case "yearly":
      next = addYears(from, interval);
      break;
    case "custom":
    default: {
      const weekdays = parseDaysOfWeek(rule.daysOfWeek);
      if (weekdays.length > 0) {
        next = addDays(from, interval);
        for (let offset = 1; offset <= 7 * interval; offset++) {
          const candidate = addDays(from, offset);
          if (weekdays.includes(candidate.getDay())) {
            next = candidate;
            break;
          }
        }
      } else {
        next = addDays(from, interval);
      }
      break;
    }
  }

  if (rule.endDate && next > rule.endDate) return null;
  return next;
}

export function shiftDate(
  date: Date | null,
  oldAnchor: Date | null,
  newAnchor: Date
): Date | null {
  if (!date || !oldAnchor) return null;
  return new Date(date.getTime() + (newAnchor.getTime() - oldAnchor.getTime()));
}
