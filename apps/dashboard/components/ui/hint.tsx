'use client';

import * as React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type TooltipContentProps
} from '@/components/ui/tooltip';

/**
 * Comfortaa Bold is the only cut we load (weight 700). A lighter weight
 * makes the browser skip that face.
 */
const hintType: React.CSSProperties = {
  fontFamily: 'var(--font-comfortaa), sans-serif',
  fontWeight: 700,
  fontStyle: 'normal',
  fontSynthesis: 'none',
  textTransform: 'none',
  letterSpacing: '0.01em',
  fontSize: '11px',
  lineHeight: 1
};

/** Geist Mono for the shortcut, grey against the tooltip ink. */
const shortcutType: React.CSSProperties = {
  fontFamily: 'var(--font-geist-mono), ui-monospace, monospace',
  fontWeight: 400,
  fontSynthesis: 'none',
  textTransform: 'none',
  letterSpacing: '0.02em',
  fontSize: '9px',
  marginLeft: '0.4em',
  color: 'color-mix(in srgb, currentColor 48%, transparent)'
};

/** "Reduce sidebar · Ctrl+B" → lowercase action, mono shortcut. */
function HintLabel({ text }: { text: string }): React.JSX.Element {
  const separator = text.indexOf(' · ');
  const action = separator === -1 ? text : text.slice(0, separator);
  const shortcut = separator === -1 ? null : text.slice(separator + 3);

  return (
    <span style={hintType}>
      {action.toLocaleLowerCase()}
      {shortcut ? <span style={shortcutType}>{shortcut}</span> : null}
    </span>
  );
}

/** Branded hover label for icon-only controls. Replaces the native `title`. */
export function Hint({
  label,
  side = 'bottom',
  disabled = false,
  children
}: {
  label: React.ReactNode;
  side?: TooltipContentProps['side'];
  disabled?: boolean;
  children: React.ReactElement;
}): React.JSX.Element {
  if (disabled) {
    return children;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={4}
        className="px-1.5 py-0.5"
        style={hintType}
      >
        {typeof label === 'string' ? <HintLabel text={label} /> : label}
      </TooltipContent>
    </Tooltip>
  );
}
