import * as React from 'react';

import { cn } from '@/lib/utils';

export type InputElement = HTMLInputElement;
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputMode, ...props }, ref) => {
    const isUrl = type === 'url';

    return (
      <input
        type={isUrl ? 'text' : type}
        inputMode={isUrl ? (inputMode ?? 'url') : inputMode}
        className={cn(
          'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          type === 'password' && 'input-sensitive-mask',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
