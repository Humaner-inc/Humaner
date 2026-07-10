import * as React from 'react';

import {
  authInnerCardClassName,
  authInnerCardContentClassName,
  authInnerCardDescriptionClassName,
  authInnerCardFooterClassName,
  authInnerCardHeaderClassName,
  authInnerCardTitleClassName
} from '@/components/auth/auth-form-styles';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardContentProps,
  type CardDescriptionProps,
  type CardFooterProps,
  type CardHeaderProps,
  type CardProps,
  type CardTitleProps
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AuthInnerCard({
  className,
  ...props
}: CardProps): React.JSX.Element {
  return (
    <Card
      className={cn(authInnerCardClassName, className)}
      {...props}
    />
  );
}

export function AuthInnerCardHeader({
  className,
  ...props
}: CardHeaderProps): React.JSX.Element {
  return (
    <CardHeader
      className={cn(authInnerCardHeaderClassName, className)}
      {...props}
    />
  );
}

export function AuthInnerCardTitle({
  className,
  ...props
}: CardTitleProps): React.JSX.Element {
  return (
    <CardTitle
      className={cn(authInnerCardTitleClassName, className)}
      {...props}
    />
  );
}

export function AuthInnerCardDescription({
  className,
  ...props
}: CardDescriptionProps): React.JSX.Element {
  return (
    <CardDescription
      className={cn(authInnerCardDescriptionClassName, className)}
      {...props}
    />
  );
}

export function AuthInnerCardContent({
  className,
  ...props
}: CardContentProps): React.JSX.Element {
  return (
    <CardContent
      className={cn(authInnerCardContentClassName, className)}
      {...props}
    />
  );
}

export function AuthInnerCardFooter({
  className,
  ...props
}: CardFooterProps): React.JSX.Element {
  return (
    <CardFooter
      className={cn(authInnerCardFooterClassName, className)}
      {...props}
    />
  );
}
