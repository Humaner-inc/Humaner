import type { WidgetIconThemeId } from "./widget-icons";

const HEADER = "#0A0D0D";
const CHROME = "#1c1c1e";
const INPUT_ELEVATED = "#2c2c2e";

/** Brand-agnostic light neutrals — same family as dashboard (#f2f2f2 / #eaeaea). */
export const WIDGET_LIGHT_SOFT = "#f2f2f2";
export const WIDGET_LIGHT_SOFT_DEEP = "#eaeaea";

export type WidgetSurfaceTokens = {
  body: string;
  header: string;
  headerBorder: string;
  headerText: string;
  headerMuted: string;
  navBorder: string;
  navText: string;
  inputShell: string;
  inputRing: string;
  inputText: string;
  formBg: string;
  watermarkBg: string;
  listCardBg: string;
  listHover: string;
  userBubble: string;
  userText: string;
  supportBubble: string;
  supportText: string;
  metaText: string;
  userMetaText: string;
};

export function widgetSurface(theme: WidgetIconThemeId): WidgetSurfaceTokens {
  if (theme === "LIGHT") {
    return {
      body: WIDGET_LIGHT_SOFT,
      // One neutral grey ladder: soft → soft-deep → white cards.
      header: WIDGET_LIGHT_SOFT_DEEP,
      headerBorder: "rgba(10,13,13,0.08)",
      headerText: "#0A0D0D",
      headerMuted: "rgba(10,13,13,0.55)",
      navBorder: "rgba(10,13,13,0.1)",
      navText: "rgba(10,13,13,0.55)",
      inputShell: "#ffffff",
      inputRing: "rgba(10,13,13,0.1)",
      inputText: "#0A0D0D",
      formBg: WIDGET_LIGHT_SOFT,
      watermarkBg: WIDGET_LIGHT_SOFT,
      listCardBg: "#ffffff",
      listHover: WIDGET_LIGHT_SOFT_DEEP,
      userBubble: "#0A0D0D",
      userText: "#ffffff",
      supportBubble: WIDGET_LIGHT_SOFT_DEEP,
      supportText: "#0A0D0D",
      metaText: "rgba(10,13,13,0.5)",
      userMetaText: "rgba(255,255,255,0.55)",
    };
  }

  return {
    body: CHROME,
    header: HEADER,
    headerBorder: "rgba(255,255,255,0.08)",
    headerText: "#fff8f2",
    headerMuted: "rgba(255,248,242,0.5)",
    navBorder: "rgba(255,255,255,0.08)",
    navText: "rgba(255,248,242,0.55)",
    inputShell: INPUT_ELEVATED,
    inputRing: "rgba(255,255,255,0.1)",
    inputText: "#fff8f2",
    formBg: CHROME,
    watermarkBg: CHROME,
    listCardBg: INPUT_ELEVATED,
    listHover: "rgba(255,255,255,0.06)",
    userBubble:
      "linear-gradient(160deg, #1a1716 0%, #121110 55%, #080706 100%)",
    userText: "#fff8f2",
    supportBubble:
      "linear-gradient(160deg, #4a4a4e 0%, #3a3a3e 45%, #2e2e32 100%)",
    supportText: "#fff8f2",
    metaText: "rgba(255,248,242,0.45)",
    userMetaText: "rgba(255,248,242,0.5)",
  };
}

export function widgetChatBubbleStyle(
  role: "user" | "assistant" | "human",
  theme: WidgetIconThemeId,
): { background: string; color: string } {
  const surface = widgetSurface(theme);
  if (role === "user") {
    return {
      background: surface.userBubble,
      color: surface.userText,
    };
  }
  return {
    background: surface.supportBubble,
    color: surface.supportText,
  };
}
