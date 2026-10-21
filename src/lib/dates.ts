import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function formatDate(
  value: Date | string | number,
  pattern = "PPP"
): string {
  return format(new Date(value), pattern, { locale: fr });
}

export function formatRelativeDate(value: Date | string | number): string {
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: fr });
}
