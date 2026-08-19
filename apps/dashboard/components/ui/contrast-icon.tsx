'use client';

import type { HTMLAttributes } from 'react';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import type { Variants } from 'motion/react';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

export interface ContrastIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ContrastIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const PATH_VARIANT: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: 180,
    transformOrigin: 'left center',
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 12
    }
  }
};

const ContrastIcon = forwardRef<ContrastIconHandle, ContrastIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const [variant, setVariant] = useState<'normal' | 'animate'>('normal');
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => setVariant('animate'),
        stopAnimation: () => setVariant('normal')
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          setVariant('animate');
        }
      },
      [onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          setVariant('normal');
        }
      },
      [onMouseLeave]
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
          <circle
            cx="12"
            cy="12"
            r="10"
          />
          <motion.path
            animate={variant}
            d="M12 18a6 6 0 0 0 0-12v12z"
            initial="normal"
            variants={PATH_VARIANT}
          />
        </svg>
      </div>
    );
  }
);

ContrastIcon.displayName = 'ContrastIcon';

export { ContrastIcon };
