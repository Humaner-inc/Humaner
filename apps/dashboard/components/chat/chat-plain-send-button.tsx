'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

export type ChatPlainSendButtonProps = {
  disabled?: boolean;
  color?: string;
  className?: string;
  success?: boolean;
};

/** Raw upward arrow — square wash appears on hover. Swaps to a check when sent. */
export function ChatPlainSendButton({
  disabled = false,
  color = 'currentColor',
  className,
  success = false
}: ChatPlainSendButtonProps): React.JSX.Element {
  return (
    <button
      type="submit"
      disabled={disabled || success}
      aria-label={success ? 'Message sent' : 'Send message'}
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 disabled:opacity-30',
        success && 'disabled:opacity-100',
        className
      )}
      style={{ color }}
    >
      <AnimatePresence
        mode="wait"
        initial={false}
      >
        {success ? (
          <motion.svg
            key="check"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <motion.path
              d="M5 12.5 9.5 17 19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.42, ease: EASE, delay: 0.04 }}
            />
          </motion.svg>
        ) : (
          <motion.svg
            key="send"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: EASE }}
          >
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  );
}
