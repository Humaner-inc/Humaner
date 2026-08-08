import * as React from "react";
import { BsChatDotsFill } from "react-icons/bs";
import { FaArrowUp, FaLocationArrow } from "react-icons/fa";
import { MdChatBubble } from "react-icons/md";
import { RiChatAi4Fill, RiSendInsFill } from "react-icons/ri";

/** Selectable launcher icons (LIVECHAT kept in DB enum for legacy rows). */
export const WIDGET_BUBBLE_ICONS = ["CHAT", "CHAT_DOTS", "CHAT_AI"] as const;
export type WidgetBubbleIconId = (typeof WIDGET_BUBBLE_ICONS)[number];

/** Selectable send icons (ARROW_SQUARE kept in DB enum for legacy rows). */
export const WIDGET_SEND_ICONS = [
  "LOCATION_ARROW",
  "ARROW_CIRCLE",
  "CHEVRON_RIGHT",
] as const;
export type WidgetSendIconId = (typeof WIDGET_SEND_ICONS)[number];

export const WIDGET_BUBBLE_ICON_META: Record<
  WidgetBubbleIconId,
  { label: string; description: string }
> = {
  CHAT: { label: "Chat", description: "Classic speech bubble" },
  CHAT_DOTS: { label: "Dots", description: "Bubble with typing dots" },
  CHAT_AI: { label: "AI chat", description: "AI-assisted conversation" },
};

export const WIDGET_SEND_ICON_META: Record<
  WidgetSendIconId,
  { label: string; description: string }
> = {
  LOCATION_ARROW: { label: "Arrow", description: "Location arrow send" },
  ARROW_CIRCLE: { label: "Arrow up", description: "Upward arrow send" },
  CHEVRON_RIGHT: { label: "Send", description: "Filled send icon" },
};

const BUBBLE_ICON_ALIASES: Record<string, WidgetBubbleIconId> = {
  chat: "CHAT",
  chatdots: "CHAT_DOTS",
  chat_dots: "CHAT_DOTS",
  message: "CHAT_DOTS",
  chatai: "CHAT_AI",
  chat_ai: "CHAT_AI",
  sparkle: "CHAT_AI",
  livechat: "CHAT",
  LIVECHAT: "CHAT",
};

const SEND_ICON_ALIASES: Record<string, WidgetSendIconId> = {
  locationarrow: "LOCATION_ARROW",
  location_arrow: "LOCATION_ARROW",
  send: "LOCATION_ARROW",
  arrowcircle: "ARROW_CIRCLE",
  arrow_circle: "ARROW_CIRCLE",
  arrowup: "ARROW_CIRCLE",
  arrow_up: "ARROW_CIRCLE",
  chevronright: "CHEVRON_RIGHT",
  chevron_right: "CHEVRON_RIGHT",
  chevron: "CHEVRON_RIGHT",
  arrowsquare: "LOCATION_ARROW",
  arrow_square: "LOCATION_ARROW",
  ARROW_SQUARE: "LOCATION_ARROW",
};

export function parseWidgetBubbleIcon(
  value: string | null | undefined,
  fallback: WidgetBubbleIconId = "CHAT",
): WidgetBubbleIconId {
  if (!value) return fallback;
  const key = value.trim().toUpperCase().replace(/-/g, "_");
  if (key === "LIVECHAT") return "CHAT";
  if ((WIDGET_BUBBLE_ICONS as readonly string[]).includes(key)) {
    return key as WidgetBubbleIconId;
  }
  const alias = BUBBLE_ICON_ALIASES[value.trim().toLowerCase()];
  return alias ?? fallback;
}

export function parseWidgetSendIcon(
  value: string | null | undefined,
  fallback: WidgetSendIconId = "LOCATION_ARROW",
): WidgetSendIconId {
  if (!value) return fallback;
  const key = value.trim().toUpperCase().replace(/-/g, "_");
  if (key === "ARROW_SQUARE") return "LOCATION_ARROW";
  if ((WIDGET_SEND_ICONS as readonly string[]).includes(key)) {
    return key as WidgetSendIconId;
  }
  const alias = SEND_ICON_ALIASES[value.trim().toLowerCase()];
  return alias ?? fallback;
}

/** Whole-widget light/dark surface (icons + chat body). */
export const WIDGET_ICON_THEMES = ["DARK", "LIGHT"] as const;
export type WidgetIconThemeId = (typeof WIDGET_ICON_THEMES)[number];

export function parseWidgetIconTheme(
  value: string | null | undefined,
  fallback: WidgetIconThemeId = "DARK",
): WidgetIconThemeId {
  if (!value) return fallback;
  const key = value.trim().toUpperCase();
  if ((WIDGET_ICON_THEMES as readonly string[]).includes(key)) {
    return key as WidgetIconThemeId;
  }
  const lower = value.trim().toLowerCase();
  if (lower === "light") return "LIGHT";
  if (lower === "dark") return "DARK";
  return fallback;
}

export type WidgetLauncherMode = "bubble" | "dock";

export type WidgetLauncherAlign = "left" | "center" | "right";

export function parseWidgetLauncherAlign(
  value: string | null | undefined,
): WidgetLauncherAlign {
  if (!value) return "right";
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("left")) return "left";
  if (normalized.includes("center")) return "center";
  return "right";
}

export function parseWidgetLauncherMode(
  value: string | null | undefined,
): WidgetLauncherMode {
  return parseWidgetLauncherAlign(value) === "center" ? "dock" : "bubble";
}

type IconSvgProps = {
  size?: number;
  className?: string;
};

export function WidgetBubbleIconSvg({
  icon,
  size = 24,
  className,
}: IconSvgProps & { icon: WidgetBubbleIconId }): React.JSX.Element {
  const props = { size, className, "aria-hidden": true as const };

  switch (icon) {
    case "CHAT_DOTS":
      return <BsChatDotsFill {...props} />;
    case "CHAT_AI":
      return <RiChatAi4Fill {...props} />;
    case "CHAT":
    default:
      return <MdChatBubble {...props} />;
  }
}

export function WidgetSendIconSvg({
  icon,
  size = 17,
  className,
}: IconSvgProps & { icon: WidgetSendIconId }): React.JSX.Element {
  const props = { size, className, "aria-hidden": true as const };

  switch (icon) {
    case "ARROW_CIRCLE":
      return <FaArrowUp {...props} />;
    case "CHEVRON_RIGHT":
      return <RiSendInsFill {...props} />;
    case "LOCATION_ARROW":
    default:
      return <FaLocationArrow {...props} />;
  }
}
