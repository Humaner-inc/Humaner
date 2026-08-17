import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 text-foreground [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background',
        info: 'border-transparent bg-info/10 text-info [&_svg]:text-info',
        warning:
          'border-transparent bg-warning/10 text-warning [&_svg]:text-warning',
        destructive:
          'border-transparent bg-destructive/10 text-destructive [&_svg]:text-destructive'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export type AlertElement = HTMLDivElement;
export type AlertProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants>;
const Alert = React.forwardRef<AlertElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

export type AlertTitleElement = HTMLHeadingElement;
export type AlertTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
const AlertTitle = React.forwardRef<AlertTitleElement, AlertTitleProps>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  )
);
AlertTitle.displayName = 'AlertTitle';

export type AlertDescriptionElement = HTMLDivElement;
export type AlertDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;
const AlertDescription = React.forwardRef<
  AlertDescriptionElement,
  AlertDescriptionProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription, AlertTitle };
