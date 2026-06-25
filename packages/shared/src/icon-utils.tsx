'use client';

import { forwardRef, type ComponentType, type HTMLAttributes } from 'react';

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

export type LucideIcon = ComponentType<LucideIconProps>;

const SIZE_CLASS_MAP: Record<string, number> = {
  'size-3': 12,
  'size-3.5': 14,
  'size-4': 16,
  'size-5': 20,
  'size-6': 24,
  'size-8': 32,
  'size-9': 36,
  'size-10': 40,
  'size-12': 48,
  'size-16': 64,
  '!h-3': 12,
  '!w-3': 12,
  '!h-4': 16,
  '!w-4': 16,
  '!h-5': 20,
  '!w-5': 20,
  'h-3': 12,
  'w-3': 12,
  'h-4': 16,
  'w-4': 16,
  'h-5': 20,
  'w-5': 20
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
export function createAnimatedIcon(Icon: ComponentType<any>, defaultSize = 16): LucideIcon {
  const AnimatedIcon = forwardRef<AnimatedIconHandle, LucideIconProps>(
    function AnimatedIcon(
      {
        className,
        size,
        animateOnHover,
        strokeWidth: _strokeWidth,
        width,
        height,
        ...props
      },
      ref
    ) {
      const resolvedSize =
        size ??
        width ??
        height ??
        parseSizeFromClassName(className) ??
        defaultSize;

      return (
        <Icon
          ref={ref}
          className={className}
          size={resolvedSize}
          animateOnHover={animateOnHover}
          {...props}
        />
      );
    }
  );

  AnimatedIcon.displayName = `Animated(${Icon.displayName ?? 'Icon'})`;

  return AnimatedIcon as LucideIcon;
}
