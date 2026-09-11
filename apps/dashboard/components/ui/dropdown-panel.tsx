import { cn } from '@/lib/utils';

type DropdownPanelProps = {
  open: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
  children: React.ReactNode;
};

export function DropdownPanel({
  open,
  align = 'left',
  className,
  children
}: DropdownPanelProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'absolute top-full z-50 origin-top pt-2.5 transition-[opacity,transform] duration-200 ease-out',
        align === 'right'
          ? 'right-0'
          : align === 'center'
            ? 'left-1/2 -translate-x-1/2'
            : 'left-0',
        open
          ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none -translate-y-2 scale-[0.98] opacity-0',
        className
      )}
      aria-hidden={!open}
    >
      {children}
    </div>
  );
}

export const DROPDOWN_PANEL_SHELL =
  'overflow-hidden rounded-lg border border-border/60 bg-popover p-1.5 shadow-lg backdrop-blur-xl';
