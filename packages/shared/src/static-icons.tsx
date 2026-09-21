"use client";

import {
  forwardRef,
  memo,
  type ForwardRefExoticComponent,
  type RefAttributes,
  type SVGProps,
} from "react";
import {
  Bot,
  Pin,
  PlugZap,
  type LucideIcon as LucideReactIcon,
} from "lucide-react";

import { resolveIconSize } from "./icon-utils";

export type StaticLucideIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
};

export type StaticLucideIcon = ForwardRefExoticComponent<
  StaticLucideIconProps & RefAttributes<SVGSVGElement>
>;

function cn(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function createStaticLucideIcon(
  Icon: LucideReactIcon,
  defaultSize = 16,
): StaticLucideIcon {
  const StaticIcon = memo(
    forwardRef<SVGSVGElement, StaticLucideIconProps>(function StaticIcon(
      { className, size, strokeWidth, width, height, ...props },
      ref,
    ) {
      const resolvedWidth = typeof width === "number" ? width : undefined;
      const resolvedHeight = typeof height === "number" ? height : undefined;
      const resolvedSize = resolveIconSize(
        className,
        size,
        resolvedWidth,
        resolvedHeight,
        defaultSize,
      );

      return (
        <Icon
          ref={ref}
          className={cn("shrink-0", className)}
          size={resolvedSize}
          strokeWidth={strokeWidth}
          aria-hidden={props["aria-hidden"] ?? true}
          {...props}
        />
      );
    }),
  );

  StaticIcon.displayName = `Static(${Icon.displayName ?? "Icon"})`;

  return StaticIcon;
}

/** Crisp SVG icons for layouts that must not use lucide-animated wrappers. */
export const BotIconStatic = createStaticLucideIcon(Bot);
export const PinIcon = createStaticLucideIcon(Pin);
export const PlugIconStatic = createStaticLucideIcon(PlugZap);
