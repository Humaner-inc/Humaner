import { cn } from '@/lib/utils';

/** Chamfered top-right corner — Humaner MCP / protocol angle. */
export const brandAngleClipClassName =
  '[clip-path:polygon(0_0,calc(100%-0.875rem)_0,100%_0.875rem,100%_100%,0_100%)]';

export function brandAngleSurfaceClassName(rounded = 'rounded-xl'): string {
  return cn(rounded, brandAngleClipClassName);
}
