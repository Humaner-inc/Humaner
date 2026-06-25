'use client';

import { MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { useTheme } from 'next-themes';

import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ThemeToggleProps = Omit<
  ButtonProps,
  'variant' | 'size' | 'onClick'
>;

export function ThemeToggle({
  className,
  ...props
}: ThemeToggleProps): React.JSX.Element {
  const { setTheme, theme } = useTheme();
  const handleToggleTheme = (): void => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggleTheme}
      className={cn('bg-background', className)}
      {...props}
    >
      <SunIcon
        className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />
      <MoonIcon
        className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
