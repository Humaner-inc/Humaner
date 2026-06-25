import * as React from 'react';

import { cn } from '@/lib/utils';

export type TableElement = HTMLTableElement;
export type TableProps = React.HTMLAttributes<HTMLTableElement> & {
  wrapperClassName?: React.HTMLAttributes<HTMLTableElement>['className'];
};
const Table = React.forwardRef<TableElement, TableProps>(
  ({ className, wrapperClassName, ...props }, ref) => (
    <div className={cn('relative w-full overflow-auto', wrapperClassName)}>
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

export type TableHeaderElement = HTMLTableSectionElement;
export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;
const TableHeader = React.forwardRef<TableHeaderElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn('bg-background [&_tr]:border-b', className)}
      {...props}
    />
  )
);
TableHeader.displayName = 'TableHeader';

export type TableBodyElement = HTMLTableSectionElement;
export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement> & {
  showLastRowBorder?: boolean;
};
const TableBody = React.forwardRef<TableBodyElement, TableBodyProps>(
  ({ showLastRowBorder, className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn(
        !showLastRowBorder && '[&_tr:last-child]:border-0',
        className
      )}
      {...props}
    />
  )
);
TableBody.displayName = 'TableBody';

export type TableFooterElement = HTMLTableSectionElement;
export type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>;
const TableFooter = React.forwardRef<TableFooterElement, TableFooterProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        'bg-primary font-medium text-primary-foreground',
        className
      )}
      {...props}
    />
  )
);
TableFooter.displayName = 'TableFooter';

export type TableRowElement = HTMLTableRowElement;
export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;
const TableRow = React.forwardRef<TableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

export type TableHeadElement = HTMLTableCellElement;
export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;
const TableHead = React.forwardRef<TableHeadElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-10 px-2 text-left align-middle font-medium text-muted-foreground',
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = 'TableHead';

export type TableCellElement = HTMLTableCellElement;
export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;
const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('p-2 align-middle', className)}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';

export type TableCaptionElement = HTMLTableCaptionElement;
export type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  TableCaptionProps
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
};
