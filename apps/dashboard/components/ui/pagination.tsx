import * as React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DotsHorizontalIcon
} from '@radix-ui/react-icons';

import { ButtonProps, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PaginationElement = React.ElementRef<'nav'>;
export type PaginationProps = React.ComponentProps<'nav'>;
const Pagination = ({ className, ...props }: PaginationProps) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);
Pagination.displayName = 'Pagination';

export type PaginationContentElement = HTMLUListElement;
export type PaginationContentProps = React.ComponentProps<'ul'>;
const PaginationContent = React.forwardRef<
  PaginationContentElement,
  PaginationContentProps
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
));
PaginationContent.displayName = 'PaginationContent';

export type PaginationItemElement = HTMLLIElement;
export type PaginationItemProps = React.ComponentProps<'li'>;
const PaginationItem = React.forwardRef<
  PaginationItemElement,
  PaginationItemProps
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn('', className)}
    {...props}
  />
));
PaginationItem.displayName = 'PaginationItem';

export type PaginationLinkElement = React.ElementRef<'a'>;
export type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, 'size'> &
  React.ComponentProps<'a'>;
const PaginationLink = ({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size
      }),
      className
    )}
    {...props}
  />
);
PaginationLink.displayName = 'PaginationLink';

export type PaginationPreviousElement = React.ElementRef<typeof PaginationLink>;
export type PaginationPreviousProps = React.ComponentProps<
  typeof PaginationLink
>;
const PaginationPrevious = ({
  className,
  ...props
}: PaginationPreviousProps) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn('gap-1 pl-2.5', className)}
    {...props}
  >
    <ChevronLeftIcon className="size-4 shrink-0" />
    <span>Previous</span>
  </PaginationLink>
);
PaginationPrevious.displayName = 'PaginationPrevious';

export type PaginationNextElement = React.ElementRef<typeof PaginationLink>;
export type PaginationNextProps = React.ComponentProps<typeof PaginationLink>;
const PaginationNext = ({ className, ...props }: PaginationNextProps) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn('gap-1 pr-2.5', className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRightIcon className="size-4 shrink-0" />
  </PaginationLink>
);
PaginationNext.displayName = 'PaginationNext';

export type PaginationEllipsisElement = React.ElementRef<'span'>;
export type PaginationEllipsisProps = React.ComponentProps<'span'>;
const PaginationEllipsis = ({
  className,
  ...props
}: PaginationEllipsisProps) => (
  <span
    aria-hidden
    className={cn('flex size-9 items-center justify-center', className)}
    {...props}
  >
    <DotsHorizontalIcon className="size-4 shrink-0" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
};
