'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export type ChatPlainSendButtonProps = {
  disabled?: boolean;
  color?: string;
  className?: string;
};

/** Raw upward arrow — square wash appears on hover. */
export function ChatPlainSendButton({
  disabled = false,
  color = '#fff8f2',
  className
}: ChatPlainSendButtonProps): React.JSX.Element {
  return (
    <button
      type="submit"
      disabled={disabled}
      aria-label="Send message"
      className={cn(
        'mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-white/10 disabled:opacity-30',
        className
      )}
      style={{ color }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}
