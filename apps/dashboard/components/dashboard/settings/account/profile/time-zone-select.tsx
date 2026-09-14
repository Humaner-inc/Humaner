'use client';

import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  formatTimeZoneLabel,
  timeZoneSelectOptions
} from '@/lib/calendar/time-zones';

const UNSET = 'unset';

export function TimeZoneSelect({
  value,
  onValueChange,
  disabled,
  allowUnset = true,
  triggerClassName
}: {
  value: string | null | undefined;
  onValueChange: (next: string | null) => void;
  disabled?: boolean;
  allowUnset?: boolean;
  triggerClassName?: string;
}): React.JSX.Element {
  const options = timeZoneSelectOptions(value);

  return (
    <Select
      value={value ?? (allowUnset ? UNSET : undefined)}
      onValueChange={(next) => onValueChange(next === UNSET ? null : next)}
      disabled={disabled}
    >
      <SelectTrigger className={triggerClassName ?? 'h-9 w-full max-w-64'}>
        <SelectValue placeholder="Timezone" />
      </SelectTrigger>
      <SelectContent>
        {allowUnset ? <SelectItem value={UNSET}>Not set</SelectItem> : null}
        {options.map((zone) => (
          <SelectItem
            key={zone}
            value={zone}
          >
            {formatTimeZoneLabel(zone)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
