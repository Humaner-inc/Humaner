import React from 'react';

import { cn } from '@/lib/utils';

export type DescriptionListProps = React.HTMLAttributes<HTMLDListElement>;

export const DescriptionList: React.FC<DescriptionListProps> = ({
  className,
  ...props
}) => {
  return (
    <dl
      className={cn('text-base sm:text-sm', className)}
      {...props}
    />
  );
};

export type DescriptionTermProps = React.HTMLAttributes<HTMLElement>;

export const DescriptionTerm: React.FC<DescriptionTermProps> = ({
  className,
  ...props
}) => {
  return (
    <dt
      className={cn(
        'border-t py-3 text-muted-foreground first:border-none sm:float-left sm:clear-left sm:w-1/3 sm:px-0',
        className
      )}
      {...props}
    />
  );
};

export type DescriptionDetailsProps = React.HTMLAttributes<HTMLElement>;

export const DescriptionDetails: React.FC<DescriptionDetailsProps> = ({
  className,
  ...props
}) => {
  return (
    <dd
      className={cn(
        'pb-3 sm:ml-[33.333333%] sm:border-t sm:pt-3 sm:[&:nth-child(2)]:border-none',
        className
      )}
      {...props}
    />
  );
};
