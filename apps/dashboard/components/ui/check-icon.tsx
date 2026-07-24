'use client';

import * as React from 'react';
import { motion, useAnimation, type Variants } from 'motion/react';

import { cn } from '@/lib/utils';

export type CheckIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

type CheckIconProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: number;
};

const PATH_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      opacity: { duration: 0.1 }
    }
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    scale: [0.5, 1],
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 }
    }
  }
};

/** Crisp stroke check — same path used in checkbox indicators. */
export function CheckMark({
  className,
  size = 14
}: {
  className?: string;
  size?: number;
}): React.JSX.Element {
  return (
    <svg
      className={cn('shrink-0', className)}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M4 12 9 17L20 6" />
    </svg>
  );
}

export function MinusMark({
  className,
  size = 14
}: {
  className?: string;
  size?: number;
}): React.JSX.Element {
  return (
    <svg
      className={cn('shrink-0', className)}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M5 12h14" />
    </svg>
  );
}

export const CheckIcon = React.forwardRef<CheckIconHandle, CheckIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = React.useRef(false);

    React.useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => {
          void controls.start('animate');
        },
        stopAnimation: () => {
          void controls.start('normal');
        }
      };
    });

    const handleMouseEnter = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(event);
        } else {
          void controls.start('animate');
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(event);
        } else {
          void controls.start('normal');
        }
      },
      [controls, onMouseLeave]
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            animate={controls}
            d="M4 12 9 17L20 6"
            initial="normal"
            variants={PATH_VARIANTS}
          />
        </svg>
      </div>
    );
  }
);

CheckIcon.displayName = 'CheckIcon';
