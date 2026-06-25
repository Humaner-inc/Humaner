import * as React from 'react';
import { ChevronRightIcon, DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

export type BreadcrumbElement = React.ElementRef<'nav'>;
export type BreadcrumbProps = React.ComponentPropsWithoutRef<'nav'> & {
  separator?: React.ReactNode;
};
const Breadcrumb = React.forwardRef<BreadcrumbElement, BreadcrumbProps>(
  ({ ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="breadcrumb"
      {...props}
    />
  )
);
Breadcrumb.displayName = 'Breadcrumb';

export type BreadcrumbListElement = HTMLOListElement;
export type BreadcrumbListProps = React.ComponentPropsWithoutRef<'ol'>;
const BreadcrumbList = React.forwardRef<
  BreadcrumbListElement,
  BreadcrumbListProps
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5',
      className
    )}
    {...props}
  />
));
BreadcrumbList.displayName = 'BreadcrumbList';

export type BreadcrumbItemElement = HTMLLIElement;
export type BreadcrumbItemProps = React.ComponentPropsWithoutRef<'li'>;
const BreadcrumbItem = React.forwardRef<
  BreadcrumbItemElement,
  BreadcrumbItemProps
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn('inline-flex items-center gap-1.5', className)}
    {...props}
  />
));
BreadcrumbItem.displayName = 'BreadcrumbItem';

export type BreadcrumbLinkElement = HTMLAnchorElement;
export type BreadcrumbLinkProps = React.ComponentPropsWithoutRef<'a'> & {
  asChild?: boolean;
};
const BreadcrumbLink = React.forwardRef<
  BreadcrumbLinkElement,
  BreadcrumbLinkProps
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : 'a';

  return (
    <Comp
      ref={ref}
      className={cn('transition-colors hover:text-foreground', className)}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = 'BreadcrumbLink';

export type BreadcrumbPageElement = HTMLSpanElement;
export type BreadcrumbPageProps = React.ComponentPropsWithoutRef<'span'>;
const BreadcrumbPage = React.forwardRef<
  BreadcrumbPageElement,
  BreadcrumbPageProps
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn('font-normal text-foreground', className)}
    {...props}
  />
));
BreadcrumbPage.displayName = 'BreadcrumbPage';

export type BreadcrumbSeparatorElement = HTMLLIElement;
export type BreadcrumbSeparatorProps = React.ComponentProps<'li'>;
const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: BreadcrumbSeparatorProps) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn('[&>svg]:size-3.5', className)}
    {...props}
  >
    {children ?? <ChevronRightIcon />}
  </li>
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

export type BreadcrumbEllipsisElement = HTMLSpanElement;
export type BreadcrumbEllipsisProps = React.ComponentProps<'span'>;
const BreadcrumbEllipsis = ({
  className,
  ...props
}: BreadcrumbEllipsisProps) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn('flex size-9 items-center justify-center', className)}
    {...props}
  >
    <DotsHorizontalIcon className="size-4 shrink-0" />
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = 'BreadcrumbElipssis';

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
};
