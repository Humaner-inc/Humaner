"use client";

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentType,
  type ForwardRefExoticComponent,
  type HTMLAttributes,
  type MouseEvent,
  type RefAttributes,
} from "react";

export type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

export type LucideIconProps = HTMLAttributes<HTMLDivElement> & {
  size?: number;
  animateOnHover?: boolean;
  strokeWidth?: number;
  width?: number;
  height?: number;
};

export type LucideIcon = ForwardRefExoticComponent<
  LucideIconProps & RefAttributes<AnimatedIconHandle>
>;

export const ICON_HOVER_PARENT_SELECTOR =
  'a, button, [role="button"], [data-sidebar="menu-button"], [data-icon-hover]';

export function bindIconHoverToParent(
  node: HTMLElement | null,
  enabled: boolean,
  start: () => void,
  stop: () => void,
): (() => void) | undefined {
  if (!enabled || !node || typeof node.closest !== "function") {
    return undefined;
  }
  const target =
    (node.closest(ICON_HOVER_PARENT_SELECTOR) as HTMLElement | null) ?? node;
  target.addEventListener("mouseenter", start);
  target.addEventListener("mouseleave", stop);
  return () => {
    target.removeEventListener("mouseenter", start);
    target.removeEventListener("mouseleave", stop);
  };
}

const SIZE_CLASS_MAP: Record<string, number> = {
  "size-3": 12,
  "size-3.5": 14,
  "size-4": 16,
  "size-5": 20,
  "size-6": 24,
  "size-7": 28,
  "size-8": 32,
  "size-9": 36,
  "size-10": 40,
  "size-11": 44,
  "size-12": 48,
  "size-16": 64,
  "size-20": 80,
  "size-24": 96,
  "size-28": 112,
  "size-32": 128,
  "size-36": 144,
  "size-44": 176,
  "!h-3": 12,
  "!w-3": 12,
  "!h-4": 16,
  "!w-4": 16,
  "!h-5": 20,
  "!w-5": 20,
  "h-3": 12,
  "w-3": 12,
  "h-4": 16,
  "w-4": 16,
  "h-5": 20,
  "w-5": 20,
};

function parseSizeFromClassName(className?: string): number | undefined {
  if (!className) {
    return undefined;
  }

  let maxSize: number | undefined;

  for (const [token, size] of Object.entries(SIZE_CLASS_MAP)) {
    if (className.includes(token)) {
      maxSize = maxSize === undefined ? size : Math.max(maxSize, size);
    }
  }

  return maxSize;
}

function cn(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAnimatedIcon(
  Icon: ComponentType<any>,
  defaultSize = 16,
): LucideIcon {
  const AnimatedIcon = memo(
    forwardRef<AnimatedIconHandle, LucideIconProps>(function AnimatedIcon(
      {
        className,
        size,
        // lucide-animated disables its own hover once a ref is attached
        // (controlled mode). We always attach a ref for imperative handles,
        // so hover must be driven from this wrapper.
        animateOnHover = true,
        strokeWidth,
        width,
        height,
        onMouseEnter,
        onMouseLeave,
        style,
        ...props
      },
      ref,
    ) {
      const innerRef = useRef<AnimatedIconHandle>(null);
      const wrapperRef = useRef<HTMLSpanElement>(null);
      const frameRef = useRef(0);
      const resolvedSize =
        size ??
        width ??
        height ??
        parseSizeFromClassName(className) ??
        defaultSize;

      const start = useCallback(() => {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(() => {
          innerRef.current?.startAnimation();
        });
      }, []);

      const stop = useCallback(() => {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(() => {
          innerRef.current?.stopAnimation();
        });
      }, []);

      useImperativeHandle(
        ref,
        () => ({
          startAnimation: start,
          stopAnimation: stop,
        }),
        [start, stop],
      );

      useEffect(() => {
        return () => cancelAnimationFrame(frameRef.current);
      }, []);

      useEffect(() => {
        return bindIconHoverToParent(
          wrapperRef.current,
          animateOnHover,
          start,
          stop,
        );
      }, [animateOnHover, start, stop]);

      if (animateOnHover) {
        return (
          <span
            ref={wrapperRef}
            className={cn(
              "inline-flex shrink-0 items-center justify-center",
              className,
            )}
            style={style}
          >
            <Icon
              {...props}
              ref={innerRef}
              className="text-current"
              size={resolvedSize}
              strokeWidth={strokeWidth}
              animateOnHover={false}
              onMouseEnter={(event: MouseEvent<HTMLDivElement>) => {
                onMouseEnter?.(event);
              }}
              onMouseLeave={(event: MouseEvent<HTMLDivElement>) => {
                onMouseLeave?.(event);
              }}
            />
          </span>
        );
      }

      return (
        <Icon
          {...props}
          ref={innerRef}
          className={cn(
            "inline-flex shrink-0 items-center justify-center text-current",
            className,
          )}
          style={style}
          size={resolvedSize}
          strokeWidth={strokeWidth}
          animateOnHover={false}
          onMouseEnter={(event: MouseEvent<HTMLDivElement>) => {
            onMouseEnter?.(event);
          }}
          onMouseLeave={(event: MouseEvent<HTMLDivElement>) => {
            onMouseLeave?.(event);
          }}
        />
      );
    }),
  );

  AnimatedIcon.displayName = `Animated(${Icon.displayName ?? "Icon"})`;

  return AnimatedIcon;
}
