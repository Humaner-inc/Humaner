export type WidgetRadiusSettings = {
  /** Floating launcher bubble (compact corner mode). */
  widget: number;
  /** Chat panel outer frame (iframe / pop-up shell). */
  popup: number;
  /** Message input container. */
  input: number;
  /** Assistant / user answer bubbles. */
  messages: number;
};

export const WIDGET_RADIUS_MIN = 0;
export const WIDGET_RADIUS_MAX = 32;

export const DEFAULT_WIDGET_RADIUS: WidgetRadiusSettings = {
  widget: 26,
  popup: 16,
  input: 18,
  messages: 16,
};

export const WIDGET_RADIUS_KEYS = [
  "widget",
  "popup",
  "input",
  "messages",
] as const satisfies readonly (keyof WidgetRadiusSettings)[];

export const WIDGET_RADIUS_META: Record<
  keyof WidgetRadiusSettings,
  { label: string; hint: string; previewSize: number }
> = {
  widget: {
    label: "Widget",
    hint: "Corner launcher bubble before chat opens.",
    previewSize: 28,
  },
  popup: {
    label: "Pop-up",
    hint: "Outer chat panel frame.",
    previewSize: 32,
  },
  input: {
    label: "Text container",
    hint: "Message input field wrapper.",
    previewSize: 24,
  },
  messages: {
    label: "Answers",
    hint: "Assistant and visitor message bubbles.",
    previewSize: 24,
  },
};

function clampRadius(value: number): number {
  if (!Number.isFinite(value)) {
    return WIDGET_RADIUS_MIN;
  }
  return Math.min(
    WIDGET_RADIUS_MAX,
    Math.max(WIDGET_RADIUS_MIN, Math.round(value)),
  );
}

export function parseWidgetRadius(value: unknown): WidgetRadiusSettings {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_WIDGET_RADIUS };
  }

  const record = value as Record<string, unknown>;
  return {
    widget: clampRadius(Number(record.widget ?? DEFAULT_WIDGET_RADIUS.widget)),
    popup: clampRadius(Number(record.popup ?? DEFAULT_WIDGET_RADIUS.popup)),
    input: clampRadius(Number(record.input ?? DEFAULT_WIDGET_RADIUS.input)),
    messages: clampRadius(
      Number(record.messages ?? DEFAULT_WIDGET_RADIUS.messages),
    ),
  };
}

export function parseWidgetRadiusFromSearchParams(
  params: Record<string, string | undefined>,
): WidgetRadiusSettings | null {
  const hasAny =
    params.widgetR != null ||
    params.popupR != null ||
    params.inputR != null ||
    params.messagesR != null;

  if (!hasAny) {
    return null;
  }

  return {
    widget: clampRadius(Number(params.widgetR ?? DEFAULT_WIDGET_RADIUS.widget)),
    popup: clampRadius(Number(params.popupR ?? DEFAULT_WIDGET_RADIUS.popup)),
    input: clampRadius(Number(params.inputR ?? DEFAULT_WIDGET_RADIUS.input)),
    messages: clampRadius(
      Number(params.messagesR ?? DEFAULT_WIDGET_RADIUS.messages),
    ),
  };
}

export function appendWidgetRadiusSearchParams(
  params: URLSearchParams,
  radius: WidgetRadiusSettings,
): void {
  params.set("widgetR", String(radius.widget));
  params.set("popupR", String(radius.popup));
  params.set("inputR", String(radius.input));
  params.set("messagesR", String(radius.messages));
}

/** True when the radius fully rounds a box of the given size. */
export function isFullyRounded(radius: number, size: number): boolean {
  return radius >= size / 2;
}

/** CSS border-radius for the compact launcher (52px). */
export function launcherBorderRadius(radius: number): string {
  return isFullyRounded(radius, 52) ? "9999px" : `${radius}px`;
}
