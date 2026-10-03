'use client';

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type MouseEvent
} from 'react';
import { useTheme } from 'next-themes';

import { Button, type ButtonProps } from '@/components/ui/button';
import {
  ContrastIcon,
  type ContrastIconHandle
} from '@/components/ui/contrast-icon';
import { cn } from '@/lib/utils';

export type ThemeToggleProps = Omit<ButtonProps, 'size'>;

export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(
  function ThemeToggle(
    { className, variant = 'outline', onClick, ...props },
    ref
  ) {
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

    const handleToggleTheme = (event: MouseEvent<HTMLButtonElement>): void => {
      onClick?.(event);
      if (!event.defaultPrevented) {
        setTheme(isDark ? 'light' : 'dark');
      }
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size="icon"
        className={cn(variant === 'outline' && 'bg-background', className)}
        {...props}
        onClick={handleToggleTheme}
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
);
