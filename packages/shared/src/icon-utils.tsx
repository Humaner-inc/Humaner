"use client";

import {
  forwardRef,
  memo,
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

  for (const [token, size] of Object.entries(SIZE_CLASS_MAP)) {
    if (className.includes(token)) {
      return size;
    }
  }

  return undefined;
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
        strokeWidth: _strokeWidth,
        width,
        height,
        onMouseEnter,
        onMouseLeave,
        ...props
      },
      ref,
    ) {
      const innerRef = useRef<AnimatedIconHandle>(null);
      const resolvedSize =
        size ??
        width ??
        height ??
        parseSizeFromClassName(className) ??
        defaultSize;

      useImperativeHandle(
        ref,
        () => ({
          startAnimation: () => innerRef.current?.startAnimation(),
          stopAnimation: () => innerRef.current?.stopAnimation(),
        }),
        [],
      );

      return (
        <Icon
          {...props}
          ref={innerRef}
          className={className}
          size={resolvedSize}
          animateOnHover={false}
          onMouseEnter={(event: MouseEvent<HTMLDivElement>) => {
            if (animateOnHover) {
              innerRef.current?.startAnimation();
            }
            onMouseEnter?.(event);
          }}
          onMouseLeave={(event: MouseEvent<HTMLDivElement>) => {
            if (animateOnHover) {
              innerRef.current?.stopAnimation();
            }
            onMouseLeave?.(event);
          }}
        />
      );
    }),
  );

  AnimatedIcon.displayName = `Animated(${Icon.displayName ?? "Icon"})`;

  return AnimatedIcon;
}
