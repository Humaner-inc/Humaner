'use client';

import * as React from 'react';
import {
  CaretSortIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
  EyeNoneIcon,
  MixerHorizontalIcon,
  PlusCircledIcon
} from '@radix-ui/react-icons';
import {
  Column,
  flexRender,
  Table as ReactTable,
  Row
} from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { EmptyText } from '@/components/ui/empty-text';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableProps
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type DataTableProps<TData> = TableProps & {
  table: ReactTable<TData>;
  fixedHeader?: boolean;
  onRowClicked?: (row: Row<TData>) => void;
};
function DataTable<TData>({
  table,
  fixedHeader,
  onRowClicked,
  ...other
}: DataTableProps<TData>): React.JSX.Element {
  const visibleColumns = table
    .getAllColumns()
    .filter((c) => c.getIsVisible()).length;
  const helperColumns = table
    .getAllColumns()
    .filter(
      (c) => (c.id === 'select' || c.id === 'actions') && c.getIsVisible()
    ).length;

  const flexColumns = visibleColumns - helperColumns;
  return (
    <Table {...other}>
      <TableHeader className={cn(fixedHeader && 'sticky top-0 z-20 shadow-sm')}>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                style={{
                  width:
                    header.column.getSize() !== 0
                      ? header.column.getSize()
                      : `${100 / flexColumns}%`,
                  minWidth:
                    header.column.getSize() !== 0
                      ? header.column.getSize()
                      : `${100 / flexColumns}%`
                }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody showLastRowBorder>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              className={onRowClicked && 'cursor-pointer'}
              onClick={() => {
                onRowClicked?.(row);
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow className="!bg-transparent">
            <TableCell
              colSpan={table.getAllColumns().length}
              className="h-24 text-center"
            >
              <EmptyText>No results.</EmptyText>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
DataTable.displayName = 'DataTable';

export type DataTableColumnHeaderProps<TData, TValue> =
  React.HTMLAttributes<HTMLDivElement> & {
    column: Column<TData, TValue>;
    title: string;
  };
function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return <div className={cn(className)}>{title}</div>;
  }
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-sm data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
              <ArrowDownIcon className="ml-2 size-4" />
            ) : column.getIsSorted() === 'asc' ? (
              <ArrowUpIcon className="ml-2 size-4" />
            ) : (
              <CaretSortIcon className="ml-2 size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {column.getCanSort() && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUpIcon className="mr-2 size-3.5 text-muted-foreground/70" />
                Asc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDownIcon className="mr-2 size-3.5 text-muted-foreground/70" />
                Desc
              </DropdownMenuItem>
            </>
          )}
          {column.getCanSort() && column.getCanHide() && (
            <DropdownMenuSeparator />
          )}
          {column.getCanHide() && (
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeNoneIcon className="mr-2 size-3.5 text-muted-foreground/70" />
              Hide
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
DataTableColumnHeader.displayName = 'DataTableColumnHeader';

export type DataTableColumnOptionsHeaderProps<TData> = {
  table: ReactTable<TData>;
};
function DataTableColumnOptionsHeader<TData>({
  table
}: DataTableColumnOptionsHeaderProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="ml-auto mr-4 flex size-8 data-[state=open]:bg-muted"
        >
          <MixerHorizontalIcon className="size-4 shrink-0" />
          <span className="sr-only">Column options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[150px]"
      >
        <DropdownMenuLabel>Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanHide()
          )
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {(
                column.columnDef.meta as typeof column.columnDef.meta & {
                  title?: string;
                }
              )?.title ?? column.columnDef.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
DataTableColumnOptionsHeader.displayName = 'DataTableColumnOptionsHeader';

export type DataTablePaginationProps<TData> = {
  table: ReactTable<TData>;
  pageSizeOptions?: number[];
};
function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50]
}: DataTablePaginationProps<TData>) {
  return (
    <div className="sticky inset-x-0 bottom-0 z-20 border-t bg-background">
      <div className="flex flex-row items-center justify-between gap-2 space-x-2 px-6 py-4">
        <div className="flex flex-row items-center gap-4 sm:gap-6 lg:gap-8">
          <div className="flex items-center space-x-2">
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-16">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="whitespace-nowrap text-sm font-medium">
              <span className="hidden sm:inline">rows per page</span>
              <span className="sm:hidden">rows</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <Button
            aria-label="Go to first page"
            variant="outline"
            className="hidden size-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <DoubleArrowLeftIcon
              className="size-4 shrink-0"
              aria-hidden="true"
            />
          </Button>
          <Button
            aria-label="Go to previous page"
            variant="outline"
            className="size-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon
              className="size-4 shrink-0"
              aria-hidden="true"
            />
          </Button>
          <Button
            aria-label="Go to next page"
            variant="outline"
            className="size-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon
              className="size-4 shrink-0"
              aria-hidden="true"
            />
          </Button>
          <Button
            aria-label="Go to last page"
            variant="outline"
            className="hidden size-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <DoubleArrowRightIcon
              className="size-4 shrink-0"
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>
    </div>
  );
}
DataTablePagination.displayName = 'DataTablePagination';

export type DataTableSelectionProps<TData> = React.PropsWithChildren<{
  table: ReactTable<TData>;
}>;
function DataTableBulkActions<TData>({
  table,
  children
}: DataTableSelectionProps<TData>): React.JSX.Element {
  return (
    <div className="absolute inset-x-0 bottom-12 z-50 mx-auto flex h-[60px] max-w-xl animate-fadeIn items-center justify-between rounded-md border bg-background px-6 py-3 shadow">
      <p className="text-sm font-semibold">
        {table.getSelectedRowModel().rows.length} selected
      </p>
      {children}
    </div>
  );
}
DataTableBulkActions.displayName = 'DataTableBulkActions';

export type DataTableFilterProps = {
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  selected: string[];
  onChange: (values: string[]) => void;
};
function DataTableFilter({
  title,
  options,
  selected,
  onChange
}: DataTableFilterProps) {
  const selectedValues = new Set(selected);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-dashed text-sm"
        >
          <PlusCircledIcon className="mr-2 size-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator
                orientation="vertical"
                className="mx-2 h-4"
              />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[200px] overflow-hidden p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={title} />
          <CommandList className="h-auto max-h-max overflow-hidden">
            <ScrollArea className="h-56">
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedValues.has(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        if (isSelected) {
                          selectedValues.delete(option.value);
                        } else {
                          selectedValues.add(option.value);
                        }
                        const filterValues = Array.from(selectedValues);
                        onChange(filterValues.length ? filterValues : []);
                      }}
                    >
                      <div
                        className={cn(
                          'mr-2 flex size-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <CheckIcon className="size-4 shrink-0" />
                      </div>
                      {option.icon && (
                        <option.icon className="mr-2 size-4 text-muted-foreground" />
                      )}
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {selectedValues.size > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => onChange([])}
                      className="justify-center text-center"
                    >
                      Clear filters
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
DataTableFilter.displayName = 'DataTableFilter';

export {
  DataTable,
  DataTableBulkActions,
  DataTableColumnHeader,
  DataTableColumnOptionsHeader,
  DataTableFilter,
  DataTablePagination
};
