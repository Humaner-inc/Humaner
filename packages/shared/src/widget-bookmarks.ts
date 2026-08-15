export const WIDGET_BOOKMARK_ICON_IDS = [
  "wave",
  "features",
  "billing",
  "security",
  "integrations",
  "support",
  "documentation",
  "faq",
  "bug",
  "book",
  "chart",
  "link",
  "doc",
  "help",
  "external",
] as const;

export type WidgetBookmarkIconId = (typeof WIDGET_BOOKMARK_ICON_IDS)[number];

export type WidgetBookmark = {
  label: string;
  url: string;
  icon: WidgetBookmarkIconId;
};

export const WIDGET_BOOKMARK_ICON_META: Record<
  WidgetBookmarkIconId,
  { label: string }
> = {
  wave: { label: "Getting started" },
  features: { label: "Features" },
  billing: { label: "Billing" },
  security: { label: "Security" },
  integrations: { label: "Integrations" },
  support: { label: "Support" },
  documentation: { label: "Documentation" },
  faq: { label: "FAQ" },
  bug: { label: "Bug" },
  book: { label: "Book" },
  chart: { label: "Chart" },
  link: { label: "Link" },
  doc: { label: "Document" },
  help: { label: "Help" },
  external: { label: "External" },
};

export const MAX_WIDGET_BOOKMARKS = 9;

function isWidgetBookmarkIconId(value: string): value is WidgetBookmarkIconId {
  return (WIDGET_BOOKMARK_ICON_IDS as readonly string[]).includes(value);
}

function normalizeBookmarkUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const url = trimmed.includes("://")
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/** Parse and sanitize bookmarks stored as JSON on the agent record. */
export function parseWidgetBookmarks(value: unknown): WidgetBookmark[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const bookmarks: WidgetBookmark[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label.trim() : "";
    const icon =
      typeof record.icon === "string" && isWidgetBookmarkIconId(record.icon)
        ? record.icon
        : "link";
    const url =
      typeof record.url === "string" ? normalizeBookmarkUrl(record.url) : null;

    if (!label || !url || label.length > 32) {
      continue;
    }

    bookmarks.push({ label, url, icon });
    if (bookmarks.length >= MAX_WIDGET_BOOKMARKS) {
      break;
    }
  }

  return bookmarks;
}
