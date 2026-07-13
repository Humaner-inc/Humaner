import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-ring',
  {
    variants: {
      variant: {
        default: 'border-border/60 bg-muted/30 text-muted-foreground',
        accent:
          'border-[color-mix(in_srgb,var(--accent-color,#e1ccaf)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent-color,#e1ccaf)_12%,transparent)] text-foreground',
        secondary: 'border-border/60 bg-muted/30 text-muted-foreground',
        destructive: 'border-destructive/40 bg-destructive/10 text-destructive',
        outline: 'border-border/60 text-foreground'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;
function Badge({
  className,
  variant,
  ...props
}: BadgeProps): React.JSX.Element {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
