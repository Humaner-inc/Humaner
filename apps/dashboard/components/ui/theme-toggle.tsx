'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

import { Button, type ButtonProps } from '@/components/ui/button';
import {
  ContrastIcon,
  type ContrastIconHandle
} from '@/components/ui/contrast-icon';
import { cn } from '@/lib/utils';

export type ThemeToggleProps = Omit<ButtonProps, 'size' | 'onClick'>;

export function ThemeToggle({
  className,
  variant = 'outline',
  ...props
}: ThemeToggleProps): React.JSX.Element {
  const { setTheme, resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const iconRef = useRef<ContrastIconHandle>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme ?? theme) === 'dark';

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (isDark) {
      iconRef.current?.startAnimation();
    } else {
      iconRef.current?.stopAnimation();
    }
  }, [mounted, isDark]);

  const handleToggleTheme = (): void => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleToggleTheme}
      className={cn('bg-background', className)}
      {...props}
    >
      <ContrastIcon
        ref={iconRef}
        size={20}
        aria-hidden="true"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
