'use client';

import * as React from 'react';
import { DashIcon } from '@radix-ui/react-icons';
import { OTPInput, OTPInputContext } from 'input-otp';

import { cn } from '@/lib/utils';

export type InputOTPElement = React.ElementRef<typeof OTPInput>;
export type InputOTPProps = React.ComponentPropsWithoutRef<typeof OTPInput>;
const InputOTP = React.forwardRef<InputOTPElement, InputOTPProps>(
  ({ className, containerClassName, ...props }, ref) => (
    <OTPInput
      ref={ref}
      containerClassName={cn(
        'flex items-center gap-2 has-[:disabled]:opacity-50',
        containerClassName
      )}
      className={cn('disabled:cursor-not-allowed', className)}
      {...props}
    />
  )
);
InputOTP.displayName = 'InputOTP';

export type InputOTPGroupElement = React.ElementRef<'div'>;
export type InputOTPGroupProps = React.ComponentPropsWithoutRef<'div'>;
const InputOTPGroup = React.forwardRef<
  InputOTPGroupElement,
  InputOTPGroupProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center', className)}
    {...props}
  />
));
InputOTPGroup.displayName = 'InputOTPGroup';

export type InputOTPSlotElement = React.ElementRef<'div'>;
export type InputOTPSlotProps = React.ComponentPropsWithoutRef<'div'> & {
  index: number;
};
const InputOTPSlot = React.forwardRef<InputOTPSlotElement, InputOTPSlotProps>(
  ({ index, className, ...props }, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex size-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md',
          isActive && 'z-10 ring-1 ring-ring',
          className
        )}
        {...props}
      >
        {char}
        {hasFakeCaret && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
          </div>
        )}
      </div>
    );
  }
);
InputOTPSlot.displayName = 'InputOTPSlot';

export type InputOTPSeparatorElement = React.ElementRef<'div'>;
export type InputOTPSeparatorProps = React.ComponentPropsWithoutRef<'div'>;
const InputOTPSeparator = React.forwardRef<
  InputOTPSeparatorElement,
  InputOTPSeparatorProps
>(({ ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    {...props}
  >
    <DashIcon />
  </div>
));
InputOTPSeparator.displayName = 'InputOTPSeparator';

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
