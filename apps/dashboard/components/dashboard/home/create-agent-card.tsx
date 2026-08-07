'use client';

import * as React from 'react';
import Link from 'next/link';

import {
  CircleDashedIcon,
  type CircleDashedIconHandle
} from '@/components/ui/circle-dashed-icon';
import { Routes } from '@/constants/routes';
import { dashboardSurfaceDashedClassName } from '@/lib/dashboard/surface-styles';
import { cn } from '@/lib/utils';

export function CreateAgentCard(): React.JSX.Element {
  const iconRef = React.useRef<CircleDashedIconHandle>(null);

  return (
    <Link
      href={Routes.AgentNew}
      className={cn(
        dashboardSurfaceDashedClassName,
        'flex min-h-[16.5rem] flex-col items-center justify-center p-4 text-center shadow-[0_2px_0_0_rgb(0_0_0_/_0.03),0_18px_40px_-28px_rgb(0_0_0_/_0.18)] transition-colors hover:border-[color-mix(in_srgb,var(--accent-color,hsl(var(--brand)))_35%,transparent)] hover:bg-muted/30'
      )}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
    >
      <CircleDashedIcon
        ref={iconRef}
        size={20}
        className="mb-2 text-muted-foreground"
      />
      <span className="text-xs font-medium">Create agent</span>
    </Link>
  );
}
