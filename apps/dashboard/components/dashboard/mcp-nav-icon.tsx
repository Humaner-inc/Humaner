'use client';

import { McpIcon } from '@/components/brand/mcp-icon';
import { cn } from '@/lib/utils';

export function McpNavIcon({
  active,
  className
}: {
  active: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <McpIcon
      variant="glyph"
      className={cn(
        'size-4 shrink-0 transition-opacity duration-200',
        active ? 'opacity-100' : 'opacity-55 group-hover/nav:opacity-90',
        className
      )}
    />
  );
}
