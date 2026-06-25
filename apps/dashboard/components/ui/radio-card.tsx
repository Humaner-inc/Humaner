import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type RadioCardsElement = React.ElementRef<
  typeof RadioGroupPrimitive.Root
>;
export type RadioCardsProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
>;
const RadioCards = React.forwardRef<RadioCardsElement, RadioCardsProps>(
  ({ value, onValueChange, ...props }, ref) => (
    <RadioGroupPrimitive.Root
      ref={ref}
      value={value}
      onValueChange={onValueChange}
      {...props}
    />
  )
);
RadioCards.displayName = 'RadioCards';

export type RadioCardItemElement = React.ElementRef<
  typeof RadioGroupPrimitive.Item
>;
export type RadioCardItemProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
> & {
  checkClassName?: React.HTMLAttributes<HTMLDivElement>['className'];
};
const RadioCardItem = React.forwardRef<
  RadioCardItemElement,
  RadioCardItemProps
>(({ className, checkClassName, children, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'group relative overflow-hidden rounded-md border border-input p-4',
      'hover:border-primary focus:border-primary focus:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:border-primary data-[state=checked]:bg-primary/5',
      className
    )}
    {...props}
  >
    {children}
    <div
      className={cn(
        'absolute bottom-2 right-2 flex size-4 items-center justify-center rounded-full border border-input bg-background group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary',
        checkClassName
      )}
    >
      <CheckIcon className="size-3 shrink-0 text-primary-foreground opacity-0 group-data-[state=checked]:opacity-100" />
    </div>
  </RadioGroupPrimitive.Item>
));
RadioCardItem.displayName = 'RadioCardItem';

export { RadioCardItem, RadioCards };
