'use client';

import {
  CheckIcon,
  ChevronDownIcon,
  SlidersHorizontal
} from '@humaner/shared/icons';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  SUPPORT_TICKET_INBOX_FILTER_OPTIONS,
  type SupportTicketInboxFilter
} from '@/lib/support-ticket-labels';

export type SupportTicketInboxFilterDropdownProps = {
  value: SupportTicketInboxFilter;
  onValueChange: (value: SupportTicketInboxFilter) => void;
  align?: 'start' | 'end';
};

export function SupportTicketInboxFilterDropdown({
  value,
  onValueChange,
  align = 'end'
}: SupportTicketInboxFilterDropdownProps): React.JSX.Element {
  const current = SUPPORT_TICKET_INBOX_FILTER_OPTIONS.find(
    (option) => option.value === value
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 max-w-[min(100%,11rem)] shrink-0 gap-1.5 px-2 text-xs font-medium"
          aria-label="Filter by status"
        >
          <SlidersHorizontal className="size-3.5 shrink-0 opacity-70" />
          <span
            className={cn(
              'inline-flex min-w-0 flex-1 items-center gap-1.5 truncate',
              !current && 'text-muted-foreground'
            )}
          >
            {current ? (
              <>
                <span
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    current.dotClass
                  )}
                  aria-hidden
                />
                <span className="truncate">{current.label}</span>
              </>
            ) : (
              'Filter'
            )}
          </span>
          <ChevronDownIcon className="size-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="w-52"
      >
        {SUPPORT_TICKET_INBOX_FILTER_OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <DropdownMenuItem
              key={option.value}
              className="flex items-center justify-between gap-2 text-xs"
              onSelect={() => onValueChange(option.value)}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn('size-2 shrink-0 rounded-full', option.dotClass)}
                  aria-hidden
                />
                <span className="truncate">{option.label}</span>
              </span>
              {selected ? (
                <CheckIcon className="size-3.5 shrink-0 text-primary" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
