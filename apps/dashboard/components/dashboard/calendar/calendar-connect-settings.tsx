'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { assignTrustedNavigation } from '@humaner/shared/urls';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import { disconnectCalendar } from '@/actions/calendar/disconnect-calendar';
import { startCalendarConnect } from '@/actions/calendar/start-calendar-connect';
import { updateCalendarMailAutomation } from '@/actions/calendar/update-calendar-mail-automation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import type { CalendarConnectionItem } from '@/data/calendar/get-workspace-calendar';
import { getLogoUrl } from '@/lib/logo';

export const CALENDAR_PROVIDERS = [
  {
    id: 'GOOGLE' as const,
    label: 'Google Calendar',
    hint: 'Sync events both ways with Google Calendar',
    logoDomain: 'google.com',
    soon: false
  },
  {
    id: 'CALENDLY' as const,
    label: 'Calendly',
    hint: 'Pull booked Calendly meetings',
    logoDomain: 'calendly.com',
    soon: false
  },
  {
    id: 'OUTLOOK' as const,
    label: 'Outlook',
    hint: 'Microsoft 365 / Outlook calendar',
    logoDomain: 'outlook.com',
    soon: true
  }
];

const PROVIDERS = CALENDAR_PROVIDERS;

function providerLabel(provider: CalendarConnectionItem['provider']): string {
  return PROVIDERS.find((item) => item.id === provider)?.label ?? provider;
}

export function CalendarConnectedLogos({
  connections
}: {
  connections: CalendarConnectionItem[];
}): React.JSX.Element | null {
  const logos: Array<{ id: string; label: string; domain: string }> = [];
  const seen = new Set<string>();
  for (const connection of connections) {
    if (seen.has(connection.provider)) continue;
    const provider = PROVIDERS.find((item) => item.id === connection.provider);
    if (!provider) continue;
    seen.add(connection.provider);
    logos.push({
      id: connection.provider,
      label: provider.label,
      domain: provider.logoDomain
    });
  }
  if (logos.length === 0) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1">
      {logos.map((logo) => (
        <img
          key={logo.id}
          src={getLogoUrl(logo.domain, 32)}
          alt={logo.label}
          title={logo.label}
          width={18}
          height={18}
          className="size-[18px] rounded-sm"
        />
      ))}
    </span>
  );
}

export function CalendarConnectSettings({
  connections,
  mailAutomation
}: {
  connections: CalendarConnectionItem[];
  mailAutomation: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const status = searchParams.get('calendar');
    if (status === 'connected') {
      toast.success('Calendar connected');
    } else if (status === 'denied') {
      toast.error('Calendar connect was cancelled');
    } else if (status === 'error') {
      toast.error('Could not connect that calendar');
    }
  }, [searchParams]);

  const { execute: connect, isExecuting: connecting } = useAction(
    startCalendarConnect,
    {
      onSuccess: ({ data }) => {
        if (data?.url && assignTrustedNavigation(data.url)) {
          return;
        }
        toast.error('No connect URL returned');
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not start calendar connect');
      }
    }
  );

  const { execute: disconnect, isExecuting: disconnecting } = useAction(
    disconnectCalendar,
    {
      onSuccess: () => {
        toast.success('Calendar disconnected');
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not disconnect calendar');
      }
    }
  );

  const { execute: saveAutomation, isExecuting: savingAutomation } = useAction(
    updateCalendarMailAutomation,
    {
      onSuccess: ({ data }) => {
        toast.success(
          data?.enabled
            ? 'Mail-to-calendar automation is on'
            : 'Mail-to-calendar automation is off'
        );
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not update calendar settings');
      }
    }
  );

  const pending = connecting || disconnecting || savingAutomation;
  const connectedIds = new Set(connections.map((item) => item.provider));

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-3 font-mono text-xs font-medium normal-case tracking-normal"
        >
          Connect calendar
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 rounded-lg p-0"
      >
        <div className="space-y-3 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Connect
          </p>
          {PROVIDERS.map((provider) => {
            const connected = connections.find(
              (item) => item.provider === provider.id
            );
            return (
              <div
                key={provider.id}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{provider.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {connected ? connected.accountEmail : provider.hint}
                  </p>
                </div>
                {connected ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 px-3 font-mono text-xs font-medium normal-case tracking-normal"
                    disabled={pending}
                    onClick={() => disconnect({ connectionId: connected.id })}
                  >
                    Disconnect
                  </Button>
                ) : provider.soon ? (
                  <span className="shrink-0 pt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    [soon]
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 shrink-0 px-3 font-mono text-xs font-medium normal-case tracking-normal"
                    disabled={pending || connectedIds.has(provider.id)}
                    onClick={() => connect({ provider: provider.id })}
                  >
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <div className="border-t border-border/60 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Calendar settings
          </p>
          <div className="mt-3 flex items-start justify-between gap-3">
            <Label
              htmlFor="mail-calendar-automation"
              className="space-y-1"
            >
              <span className="text-sm font-medium">Add events from mail</span>
              <span className="block text-xs font-normal text-muted-foreground">
                When a meeting or appointment is confirmed in the inbox,
                Companion adds it to this calendar.
              </span>
            </Label>
            <Switch
              id="mail-calendar-automation"
              checked={mailAutomation}
              disabled={pending}
              onCheckedChange={(enabled) => saveAutomation({ enabled })}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
