"use client";

import * as React from "react";

import {
  AlertCircleIcon,
  BarChart3,
  BlocksIcon,
  BookOpen,
  CreditCardIcon,
  ExternalLinkIcon,
  FileTextIcon,
  HeadsetIcon,
  InfoIcon,
  Link2Icon,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "./icons";
import type { WidgetBookmarkIconId } from "./widget-bookmarks";

type WidgetBookmarkIconProps = {
  icon: WidgetBookmarkIconId;
  size?: number;
  className?: string;
  animated?: boolean;
};

const LUCIDE_BOOKMARK_ICONS: Partial<Record<WidgetBookmarkIconId, LucideIcon>> =
  {
    features: Sparkles,
    billing: CreditCardIcon,
    security: ShieldCheck,
    integrations: BlocksIcon,
    support: HeadsetIcon,
    documentation: BookOpen,
    faq: InfoIcon,
    book: BookOpen,
    chart: BarChart3,
    link: Link2Icon,
    doc: FileTextIcon,
    help: InfoIcon,
    external: ExternalLinkIcon,
    bug: AlertCircleIcon,
  };

function WavingHandIcon({
  size = 14,
  className,
  animated = true,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={
        animated
          ? { transformOrigin: "70% 80%", display: "block" }
          : { display: "block" }
      }
      data-humaner-wave={animated ? "true" : undefined}
    >
      <path d="M8.5 13.5V7.2a1.4 1.4 0 1 1 2.8 0V12" />
      <path d="M11.3 12.2V5.8a1.4 1.4 0 1 1 2.8 0V12" />
      <path d="M14.1 12.4V7.6a1.4 1.4 0 1 1 2.8 0v7.1c0 3.1-2.2 5.3-5.4 5.3-2.4 0-4.2-1-5.5-2.6L6 14.4a1.5 1.5 0 0 1 2.2-2.1l.3.3" />
      <path d="M17 8.2c.6-.7 1.1-1 1.7-1" />
    </svg>
  );
}

export function WidgetBookmarkIconStyles(): React.JSX.Element {
  return (
    <style>{`
      @keyframes humaner-wave {
        0%, 100% { transform: rotate(0deg); }
        20% { transform: rotate(16deg); }
        40% { transform: rotate(-8deg); }
        60% { transform: rotate(12deg); }
        80% { transform: rotate(-4deg); }
      }
      a:hover [data-humaner-wave="true"],
      button:hover [data-humaner-wave="true"],
      [data-icon-hover]:hover [data-humaner-wave="true"] {
        animation: humaner-wave 0.65s ease-in-out;
      }
    `}</style>
  );
}

export function WidgetBookmarkIcon({
  icon,
  size = 14,
  className,
  animated = true,
}: WidgetBookmarkIconProps): React.JSX.Element {
  if (icon === "wave") {
    return (
      <WavingHandIcon size={size} className={className} animated={animated} />
    );
  }

  const Icon = LUCIDE_BOOKMARK_ICONS[icon] ?? Link2Icon;
  return <Icon size={size} className={className} animateOnHover={animated} />;
}
