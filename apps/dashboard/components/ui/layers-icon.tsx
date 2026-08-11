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
import type { Transition } from 'motion/react';
import { motion, useAnimation } from 'motion/react';

import { cn } from '@/lib/utils';

export interface LayersIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface LayersIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 14,
  mass: 1
};

const LayersIcon = forwardRef<LayersIconHandle, LayersIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);
    const rootRef = useRef<HTMLDivElement>(null);

    const start = useCallback(async () => {
      await controls.start('firstState');
      await controls.start('secondState');
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
          <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
          <motion.path
            animate={controls}
            d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { y: 0 },
              firstState: { y: -9 },
              secondState: { y: 0 }
            }}
          />
          <motion.path
            animate={controls}
            d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"
            transition={DEFAULT_TRANSITION}
            variants={{
              normal: { y: 0 },
              firstState: { y: -5 },
              secondState: { y: 0 }
            }}
          />
        </svg>
      </div>
    );
  }
);

LayersIcon.displayName = 'LayersIcon';

export { LayersIcon };
