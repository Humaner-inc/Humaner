'use client';

import * as React from 'react';
import { EyeIcon, EyeOffIcon } from '@humaner/shared/icons';

import { Button } from '@/components/ui/button';
import {
  InputWithAdornments,
  type InputWithAdornmentsElement,
  type InputWithAdornmentsProps
} from '@/components/ui/input-with-adornments';
import { cn } from '@/lib/utils';

export type InputPasswordElement = InputWithAdornmentsElement;
export type InputPasswordProps = Omit<
  InputWithAdornmentsProps,
  'endAdornment' | 'type'
>;

const InputPassword = React.forwardRef<
  InputPasswordElement,
  InputPasswordProps
>(function InputPassword({ className, disabled, ...props }, ref) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <InputWithAdornments
      {...props}
      ref={ref}
      type="text"
      spellCheck={false}
      disabled={disabled}
      className={cn(!showPassword && 'input-sensitive-mask', className)}
      endAdornment={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Toggle password visibility"
          className="-mr-2.5 size-8"
          onClick={() => setShowPassword((prev) => !prev)}
          onMouseDown={(event) => event.preventDefault()}
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOffIcon className="size-4 shrink-0" />
          ) : (
            <EyeIcon className="size-4 shrink-0" />
          )}
        </Button>
      }
    />
  );
});
InputPassword.displayName = 'InputPassword';

export { InputPassword };
