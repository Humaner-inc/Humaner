'use client';

import * as React from 'react';
import { ActionType } from '@prisma/client';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowRightIcon, ClockIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { contactRecordLabel, contactStageLabel } from '@/constants/labels';
import { capitalize, cn, getInitials } from '@/lib/utils';
import type { ActivityTimelineEventDto } from '@/types/dtos/timeline-event-dto';

export interface ContactTimelineActivityProps {
  event: ActivityTimelineEventDto;
}

export function ContactTimelineActivity({
  event
}: ContactTimelineActivityProps): React.JSX.Element {
  const changes = React.useMemo(() => {
    if (!event.metadata) return null;
    return Object.entries(event.metadata).map(([key, value]) => ({
      key,
      oldValue: value.old || 'Empty',
      newValue: value.new || 'Empty'
    }));
  }, [event.metadata]);

  return (
    <div className="flex w-full items-start space-x-4">
      <Avatar
        title={event.actor.name}
        className="relative ml-0.5 size-6 flex-none rounded-full"
      >
        <AvatarImage
          src={event.actor.image}
          alt="avatar"
        />
        <AvatarFallback className="size-6 text-[10px]">
          {getInitials(event.actor.name)}
        </AvatarFallback>
      </Avatar>
      <div className="mt-1 min-w-0 grow space-y-2">
        <h3 className="text-xs font-medium">
          {event.actor.name}{' '}
          <span className="font-normal text-muted-foreground">
            {actionTypeToText[event.actionType]}
          </span>
        </h3>
        {changes && (
          <div className="space-y-2 rounded-lg border p-4">
            {changes.map(({ key, oldValue, newValue }) => (
              <div
                key={key}
                className="flex w-full flex-col gap-2"
              >
                <span className="block text-xs font-medium text-muted-foreground">
                  {capitalize(key)}
                </span>
                <div className="flex w-full flex-row items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <ValueBadge
                      property={key}
                      value={oldValue}
                      variant="Old"
                    />
                  </div>
                  <ArrowRightIcon
                    className="block size-3 shrink-0 text-muted-foreground opacity-65"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <ValueBadge
                      property={key}
                      value={newValue}
                      variant="New"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex w-fit items-center space-x-1 text-xs text-muted-foreground">
              <ClockIcon className="size-3 shrink-0" />
              <time suppressHydrationWarning>
                {formatDistanceToNow(event.occurredAt, { addSuffix: true })}
              </time>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {format(event.occurredAt, 'd MMM yyyy HH:mm:ss')}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

const actionTypeToText: Record<ActionType, string> = {
  [ActionType.CREATE]: 'created the contact.',
  [ActionType.UPDATE]: 'updated the contact.',
  [ActionType.DELETE]: 'deleted the contact.'
};

type ValueBadgeProps = {
  property: string;
  value: string;
  variant: 'Old' | 'New';
};

const propertyLabelMap: Record<string, Record<string, string>> = {
  record: contactRecordLabel,
  stage: contactStageLabel
};

function ValueBadge({
  property,
  value,
  variant
}: ValueBadgeProps): React.JSX.Element {
  const text = React.useMemo(() => {
    if (!value) return 'Empty';
    return propertyLabelMap[property]?.[value] || value;
  }, [property, value]);

  const isEmpty = !value;

  return (
    <Badge
      className={cn(
        'block w-full truncate font-normal',
        variant === 'Old' && 'line-through',
        isEmpty &&
          'border-neutral-300 text-muted-foreground opacity-65 dark:border-neutral-700'
      )}
      variant={isEmpty ? 'secondary' : 'outline'}
      title={text}
    >
      {text}
    </Badge>
  );
}
