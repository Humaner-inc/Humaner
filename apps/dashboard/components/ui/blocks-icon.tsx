'use client';

import type { HTMLAttributes } from 'react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import { bindIconHoverToParent } from '@humaner/shared/icons';
import type { Variants } from 'motion/react';
import { motion, useAnimation } from 'motion/react';

import { cn } from '@/lib/utils';

export interface BlocksIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface BlocksIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const VARIANTS: Variants = {
  normal: { translateX: 0, translateY: 0 },
  animate: { translateX: -4, translateY: 4 }
};

const BlocksIcon = forwardRef<BlocksIconHandle, BlocksIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const start = useCallback(() => {
      void controls.start('animate');
    }, [controls]);

    const stop = useCallback(() => {
      void controls.start('normal');
    }, [controls]);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: start,
        stopAnimation: stop
      };
    });

    useEffect(() => {
      if (isControlledRef.current) return;
      return bindIconHoverToParent(rootRef.current, true, start, stop);
    }, [start, stop]);

    return (
      <div
        ref={rootRef}
        className={cn(className)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
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
          <path d="M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3" />
          <motion.path
            animate={controls}
            d="M14 3h7v7h-7z"
            variants={VARIANTS}
          />
        </svg>
      </div>
    );
  }
);

BlocksIcon.displayName = 'BlocksIcon';

export { BlocksIcon };
