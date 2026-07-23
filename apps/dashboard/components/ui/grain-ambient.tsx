import { cn } from '@/lib/utils';

export function GrainAmbient({
  className
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'grain-ambient pointer-events-none absolute inset-0',
        className
      )}
      aria-hidden
    />
  );
}
