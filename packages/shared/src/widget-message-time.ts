/** Widget bubble footer — matches the landing mockup (`10:42 AM`). */
export function formatWidgetMessageTime(
  value: string | number | Date | null | undefined,
): string {
  if (value == null || value === "") {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function nowIso(): string {
  return new Date().toISOString();
}
