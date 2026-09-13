import * as React from 'react';

import { cn } from '@/lib/utils';

/** Paths from `/mcp-icon.svg` — Humaner MCP protocol mark. */
const MCP_PATHS = [
  'M23.5996 85.2532L86.2021 22.6507C94.8457 14.0071 108.86 14.0071 117.503 22.6507C126.147 31.2942 126.147 45.3083 117.503 53.9519L70.2254 101.23',
  'M70.8789 100.578L117.504 53.952C126.148 45.3083 140.163 45.3083 148.806 53.952L149.132 54.278C157.776 62.9216 157.776 76.9357 149.132 85.5792L92.5139 142.198C89.6327 145.079 89.6327 149.75 92.5139 152.631L104.14 164.257',
  'M101.853 38.3013L55.553 84.6011C46.9094 93.2447 46.9094 107.258 55.553 115.902C64.1966 124.546 78.2106 124.546 86.8543 115.902L133.154 69.6025'
] as const;

type McpIconProps = React.SVGAttributes<SVGSVGElement> & {
  /** Full black tile (page header) vs glyph-only paths (inline). */
  variant?: 'mark' | 'glyph';
};

/** Humaner MCP mark — angled protocol strokes from brand `mcp-icon.svg`. */
export function McpIcon({
  className,
  variant = 'mark',
  ...props
}: McpIconProps): React.JSX.Element {
  if (variant === 'glyph') {
    return (
      <svg
        viewBox="0 0 180 180"
        fill="none"
        aria-hidden
        className={cn('size-4 shrink-0', className)}
        {...props}
      >
        <g
          stroke="currentColor"
          strokeWidth="11.0667"
          strokeLinecap="round"
          fill="none"
        >
          {MCP_PATHS.map((path) => (
            <path
              key={path}
              d={path}
            />
          ))}
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      aria-hidden
      className={cn('size-11 shrink-0', className)}
      {...props}
    >
      <rect
        width="180"
        height="180"
        rx="24"
        className="fill-[#0A0D0D] dark:fill-[#0A0D0D]"
      />
      <g
        stroke="#fcf4ec"
        strokeWidth="11.0667"
        strokeLinecap="round"
        fill="none"
      >
        {MCP_PATHS.map((path) => (
          <path
            key={path}
            d={path}
          />
        ))}
      </g>
    </svg>
  );
}
